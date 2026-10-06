param(
    [string]$BaseUrl = "http://127.0.0.1:20128",
    [string]$Model = "auto/best-coding",
    [string]$KeyEnv = "OMNIROUTE_KEY"
)

$ErrorActionPreference = "Stop"

function Read-SafeEnvPosture([string]$Path) {
    if (-not (Test-Path $Path)) {
        return [pscustomobject]@{ Path=$Path; Exists=$false; REQUIRE_API_KEY=""; DATA_DIR=""; API_KEY_SECRET=""; JWT_SECRET=""; INITIAL_PASSWORD="" }
    }

    $map = @{}
    foreach ($line in Get-Content -LiteralPath $Path -ErrorAction SilentlyContinue) {
        if ($line -match '^\s*#' -or $line -notmatch '=') { continue }
        $i = $line.IndexOf('=')
        if ($i -lt 1) { continue }
        $name = $line.Substring(0,$i).Trim()
        $value = $line.Substring($i+1).Trim()
        $map[$name] = $value
    }

    [pscustomobject]@{
        Path = $Path
        Exists = $true
        REQUIRE_API_KEY = if ($map.ContainsKey("REQUIRE_API_KEY")) { $map["REQUIRE_API_KEY"] } else { "<unset>" }
        DATA_DIR = if ($map.ContainsKey("DATA_DIR")) { $map["DATA_DIR"] } else { "<unset>" }
        API_KEY_SECRET = if ($map.ContainsKey("API_KEY_SECRET") -and $map["API_KEY_SECRET"]) { "<set>" } else { "<unset>" }
        JWT_SECRET = if ($map.ContainsKey("JWT_SECRET") -and $map["JWT_SECRET"]) { "<set>" } else { "<unset>" }
        INITIAL_PASSWORD = if ($map.ContainsKey("INITIAL_PASSWORD") -and $map["INITIAL_PASSWORD"] -and $map["INITIAL_PASSWORD"] -ne "CHANGEME") { "<set-nondefault>" } elseif ($map["INITIAL_PASSWORD"] -eq "CHANGEME") { "<default-CHANGEME>" } else { "<unset>" }
    }
}

function Invoke-CurlProbe([string]$Url, [string]$Body, [string]$Bearer = "") {
    $tmp = Join-Path $env:TEMP ("rhb_omni_probe_" + [guid]::NewGuid().ToString("N") + ".txt")
    try {
        $args = @(
            "-sS",
            "--connect-timeout","5",
            "--max-time","45",
            "-o",$tmp,
            "-w","%{http_code}",
            "-X","POST",
            $Url,
            "-H","Content-Type: application/json"
        )
        if ($Bearer) {
            $args += @("-H",("Authorization: Bearer " + $Bearer))
        }
        $args += @("--data-binary",$Body)

        $code = (& curl.exe @args)
        $content = if (Test-Path $tmp) { Get-Content $tmp -Raw -ErrorAction SilentlyContinue } else { "" }

        return [pscustomobject]@{
            Code = [string]$code
            Body = [string]$content
        }
    } finally {
        Remove-Item $tmp -Force -ErrorAction SilentlyContinue
    }
}

function Show-Probe([string]$Name, $Result) {
    Write-Host ""
    Write-Host "=== $Name ===" -ForegroundColor Cyan
    Write-Host ("HTTP " + $Result.Code)

    $b = [string]$Result.Body
    if ($b.Length -gt 1800) { $b = $b.Substring(0,1800) + "...<truncated>" }
    if ($b) { Write-Host $b }
}

Write-Host "=== RHB STUDIO - OmniRoute inference auth diagnostic ===" -ForegroundColor Cyan

$listener = Get-NetTCPConnection -LocalPort 20128 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $listener) { throw "Nothing is listening on :20128." }
Write-Host "Listener PID: $($listener.OwningProcess)"

try {
    $h = Invoke-RestMethod "$BaseUrl/api/monitoring/health" -TimeoutSec 8
    Write-Host "Health: $($h.status)"
} catch {
    throw "Health probe failed: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== SAFE CONFIG POSTURE ===" -ForegroundColor Cyan
@(
    Read-SafeEnvPosture "C:\GitHub\OmniRoute\.env"
    Read-SafeEnvPosture (Join-Path $env:APPDATA "omniroute\server.env")
) | Format-Table -AutoSize

$key = [Environment]::GetEnvironmentVariable($KeyEnv,"User")
if (-not $key) { $key = [Environment]::GetEnvironmentVariable($KeyEnv,"Process") }

Write-Host ""
Write-Host "$KeyEnv present: $([bool]$key)"
if ($key) {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $hash = $sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($key))
        $fingerprint = ([BitConverter]::ToString($hash) -replace '-','').ToLower().Substring(0,12)
        Write-Host "$KeyEnv fingerprint: $fingerprint"
    } finally {
        $sha.Dispose()
    }
}

$payload = @{
    model = $Model
    messages = @(@{ role="user"; content="Reply only with RHB_AUTH_OK" })
    max_tokens = 16
} | ConvertTo-Json -Depth 8 -Compress

$endpoint = "$BaseUrl/v1/chat/completions"

$anon = Invoke-CurlProbe -Url $endpoint -Body $payload
Show-Probe "CHAT WITHOUT AUTH" $anon

if ($key) {
    $withKey = Invoke-CurlProbe -Url $endpoint -Body $payload -Bearer $key
    Show-Probe "CHAT WITH $KeyEnv" $withKey
} else {
    $withKey = $null
}

Write-Host ""
Write-Host "=== CLASSIFICATION ===" -ForegroundColor Cyan

if (-not $key) {
    Write-Host "LOCAL_KEY_MISSING: $KeyEnv is not available in User or Process environment." -ForegroundColor Red
    exit 10
}

$keyBody = [string]$withKey.Body

if ($withKey.Code -eq "401" -and ($keyBody -match "Invalid API key|AUTH_002|Authentication required")) {
    Write-Host "LOCAL_API_KEY_REJECTED" -ForegroundColor Red
    Write-Host "OmniRoute itself rejected the client credential before model routing."
    Write-Host "Do NOT reauthenticate Codex yet. Recover/register the active OmniRoute client API key first."
    exit 11
}

if ($anon.Code -eq "401" -and $withKey.Code -ne "401") {
    Write-Host "LOCAL_API_KEY_ACCEPTED" -ForegroundColor Green
    Write-Host "The request passed OmniRoute client authentication. Any provider/auth error in the keyed response is downstream."
    exit 0
}

if ($anon.Code -ne "401") {
    Write-Host "INFERENCE_AUTH_NOT_ENFORCED_OR_SESSION_ALLOWED" -ForegroundColor Yellow
    Write-Host "Anonymous inference reached routing. Inspect REQUIRE_API_KEY before exposing this service beyond loopback."
    exit 0
}

if ($withKey.Code -eq "401") {
    Write-Host "DOWNSTREAM_OR_UNCLASSIFIED_401" -ForegroundColor Yellow
    Write-Host "The keyed request is still 401, but the body does not match OmniRoute's standard local AUTH_002 rejection."
    Write-Host "Inspect the response body above; this may be provider OAuth/session authentication."
    exit 12
}

Write-Host "KEYED_REQUEST_REACHED_ROUTING" -ForegroundColor Green
Write-Host "HTTP $($withKey.Code) is not a local 401. Continue with provider/model diagnosis."
