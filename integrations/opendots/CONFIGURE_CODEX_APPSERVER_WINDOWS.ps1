param(
    [string]$OmniRoot = "C:\GitHub\OmniRoute",
    [string]$OmniLauncher = "C:\Users\us_es\Desktop\XXXIA STUDIO CORE\XXXIA_RUNTIME_SMOKE_TEST_V0_4_1\scripts\01_START_OMNIROUTE.ps1",
    [string]$OpenDotsDir = "$env:USERPROFILE\Desktop\RHB_STUDIO_OPENDOTS",
    [int]$OmniPort = 20128,
    [int]$CodexPort = 1456
)

$ErrorActionPreference = "Stop"

function Set-EnvFileValue([string]$Path,[string]$Name,[string]$Value) {
    $lines = @()
    if (Test-Path $Path) { $lines = @(Get-Content -LiteralPath $Path -ErrorAction Stop) }
    $escaped = [regex]::Escape($Name)
    $found = $false
    $out = foreach ($line in $lines) {
        if ($line -match ("^" + $escaped + "=")) {
            $found = $true
            "$Name=$Value"
        } else { $line }
    }
    if (-not $found) { $out += "$Name=$Value" }
    Set-Content -LiteralPath $Path -Value $out -Encoding UTF8
}

function Get-Listener([int]$Port) {
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
}

function Test-OmniHealth {
    try {
        $r = Invoke-RestMethod "http://127.0.0.1:$OmniPort/api/monitoring/health" -TimeoutSec 5
        return ($r.status -eq "healthy")
    } catch { return $false }
}

function Invoke-Chat([string]$Model) {
    $payload = @{
        model = $Model
        messages = @(@{ role="user"; content="Reply exactly: RHB_CODEX_OK" })
        max_tokens = 24
    } | ConvertTo-Json -Depth 8 -Compress

    try {
        $r = Invoke-WebRequest -Method Post `
            -Uri "http://127.0.0.1:$OmniPort/v1/chat/completions" `
            -ContentType "application/json; charset=utf-8" `
            -Body ([Text.Encoding]::UTF8.GetBytes($payload)) `
            -TimeoutSec 60 `
            -UseBasicParsing
        return [pscustomobject]@{ Http=[int]$r.StatusCode; Body=[string]$r.Content }
    } catch [System.Net.WebException] {
        $resp = $_.Exception.Response
        $code = 0; $body = ""
        if ($resp) {
            try { $code = [int]$resp.StatusCode } catch {}
            try {
                $reader = New-Object IO.StreamReader($resp.GetResponseStream())
                try { $body = $reader.ReadToEnd() } finally { $reader.Dispose() }
            } catch {}
        }
        if (-not $body) { $body = $_.Exception.Message }
        return [pscustomobject]@{ Http=$code; Body=$body }
    }
}

Write-Host "=== RHB STUDIO - Configure Codex App-Server for OmniRoute ===" -ForegroundColor Cyan

if (-not (Get-Command codex -ErrorAction SilentlyContinue)) { throw "Codex CLI is not installed or not in PATH." }
if (-not (Test-Path $OmniRoot)) { throw "OmniRoute root not found: $OmniRoot" }
if (-not (Test-Path $OmniLauncher)) { throw "OmniRoute launcher not found: $OmniLauncher" }
if (-not (Test-Path $OpenDotsDir)) { New-Item -ItemType Directory -Path $OpenDotsDir -Force | Out-Null }

$codexVersion = (& codex --version 2>&1 | Out-String).Trim()
Write-Host "Codex: $codexVersion"

$help = (& codex app-server --help 2>&1 | Out-String)
foreach ($flag in @("--listen","--ws-auth","--ws-token-file")) {
    if ($help -notmatch [regex]::Escape($flag)) {
        throw "This Codex CLI does not expose $flag for app-server. Update Codex CLI before continuing."
    }
}
Write-Host "Codex app-server WebSocket auth flags: OK" -ForegroundColor Green

$prevNative = $PSNativeCommandUseErrorActionPreference
try {
    if ($null -ne $PSNativeCommandUseErrorActionPreference) {
        $PSNativeCommandUseErrorActionPreference = $false
    }
    $loginStatus = (& codex login status 2>&1 | Out-String).Trim()
    $loginExit = $LASTEXITCODE
} finally {
    if ($null -ne $prevNative) {
        $PSNativeCommandUseErrorActionPreference = $prevNative
    }
}

Write-Host "Codex login status:"
Write-Host $loginStatus

$loggedIn = ($loginStatus -match "Logged in using ChatGPT|logged in|signed in") -and
            ($loginStatus -notmatch "not logged|not signed|unauth|login required")

if (-not $loggedIn -and $loginExit -ne 0) {
    Write-Host ""
    Write-Host "Codex is not authenticated. Run this and complete the browser/device login:" -ForegroundColor Yellow
    Write-Host "  codex login --device-auth"
    throw "Codex login is required before app-server can be used."
}

$dataDir = Join-Path $env:APPDATA "omniroute"
$serverEnv = Join-Path $dataDir "server.env"
$appServerDir = Join-Path $dataDir "codex-app-server"
$tokenFile = Join-Path $appServerDir "ws-token"
New-Item -ItemType Directory -Path $appServerDir -Force | Out-Null

if (-not (Test-Path $serverEnv)) { New-Item -ItemType File -Path $serverEnv -Force | Out-Null }
$backup = "$serverEnv.bak_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item -LiteralPath $serverEnv -Destination $backup -Force
Write-Host "Backed up server.env -> $backup"

if (-not (Test-Path $tokenFile) -or -not ((Get-Content -LiteralPath $tokenFile -Raw -ErrorAction SilentlyContinue).Trim())) {
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    $token = ([BitConverter]::ToString($bytes) -replace "-","").ToLowerInvariant()
    Set-Content -LiteralPath $tokenFile -Value $token -Encoding Ascii -NoNewline
    Write-Host "Created local Codex app-server capability token (secret not displayed)."
} else {
    Write-Host "Reusing existing Codex app-server capability token file."
}

$wsUrl = "ws://127.0.0.1:$CodexPort"
Set-EnvFileValue $serverEnv "OMNIROUTE_CODEX_APPSERVER_WS" $wsUrl
Set-EnvFileValue $serverEnv "OMNIROUTE_CODEX_APPSERVER_WS_TOKEN_FILE" $tokenFile
Set-EnvFileValue $serverEnv "OMNIROUTE_CODEX_APPSERVER_CWD" $OpenDotsDir
Set-EnvFileValue $serverEnv "OMNIROUTE_CODEX_APPSERVER_APPROVAL" "never"
Set-EnvFileValue $serverEnv "OMNIROUTE_CODEX_APPSERVER_SANDBOX" "workspace-write"
Set-EnvFileValue $serverEnv "OMNIROUTE_CODEX_APPSERVER_AUTO_APPROVE" "false"
Write-Host "Persisted Codex app-server settings in $serverEnv"

$codexListener = Get-Listener $CodexPort
if ($codexListener) {
    Write-Host "Codex app-server already listening on :$CodexPort (PID $($codexListener.OwningProcess))."
} else {
    Write-Host "Starting Codex app-server on $wsUrl ..." -ForegroundColor Cyan
    $codexCmd = (Get-Command codex.cmd -ErrorAction SilentlyContinue)
    if ($codexCmd) {
        Start-Process cmd.exe -ArgumentList @("/k", "`"`"$($codexCmd.Source)`" app-server --listen `"$wsUrl`" --ws-auth capability-token --ws-token-file `"$tokenFile`"`"")
    } else {
        $cmd = "codex app-server --listen `"$wsUrl`" --ws-auth capability-token --ws-token-file `"$tokenFile`""
        Start-Process powershell.exe -ArgumentList @("-NoExit","-ExecutionPolicy","Bypass","-Command",$cmd)
    }
}

$codexReady = $false
foreach ($i in 1..30) {
    Start-Sleep -Seconds 1
    try {
        $r = Invoke-WebRequest "http://127.0.0.1:$CodexPort/readyz" -UseBasicParsing -TimeoutSec 2
        if ($r.StatusCode -eq 200) { $codexReady = $true; break }
    } catch {}
}
if (-not $codexReady) { throw "Codex app-server did not become ready on :$CodexPort." }
Write-Host "Codex app-server READY on :$CodexPort." -ForegroundColor Green

$omniListener = Get-Listener $OmniPort
if ($omniListener) {
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($omniListener.OwningProcess)" -ErrorAction SilentlyContinue
    $cmdline = if ($proc) { [string]$proc.CommandLine } else { "" }
    if ($cmdline -and $cmdline -notmatch [regex]::Escape($OmniRoot)) {
        throw "Port $OmniPort is owned by PID $($omniListener.OwningProcess), not identifiable as OmniRoute. Refusing to stop it."
    }
    Write-Host "Restarting OmniRoute so it loads Codex app-server settings..." -ForegroundColor Cyan
    & taskkill.exe /PID $omniListener.OwningProcess /T /F | Out-Null
    Start-Sleep -Seconds 3
}

foreach ($lock in @((Join-Path $OmniRoot ".build\next\dev\lock"),(Join-Path $OmniRoot ".next\dev\lock"))) {
    if (Test-Path $lock) {
        $stale = "$lock.stale_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Move-Item -LiteralPath $lock -Destination $stale -Force
        Write-Host "Moved stale Next lock -> $stale"
    }
}

& $OmniLauncher

$omniReady = $false
foreach ($i in 1..90) {
    Start-Sleep -Seconds 1
    if ((Get-Listener $OmniPort) -and (Test-OmniHealth)) { $omniReady = $true; break }
    if (($i % 10) -eq 0) { Write-Host "Waiting for OmniRoute health... $i s" }
}
if (-not $omniReady) { throw "OmniRoute did not become healthy after restart." }
Write-Host "OmniRoute HEALTHY." -ForegroundColor Green

Write-Host ""
Write-Host "Testing cxa/gpt-5.6-sol through OmniRoute..." -ForegroundColor Cyan
$test = Invoke-Chat "cxa/gpt-5.6-sol"
Write-Host "HTTP $($test.Http)"
$display = [string]$test.Body
if ($display.Length -gt 2400) { $display = $display.Substring(0,2400) + "...<truncated>" }
if ($display) { Write-Host $display }

if ($test.Http -ge 200 -and $test.Http -lt 300 -and $test.Body -match "RHB_CODEX_OK") {
    Write-Host ""
    Write-Host "CODEX_APP_SERVER_OK" -ForegroundColor Green
    Write-Host "OmniRoute model ready: cxa/gpt-5.6-sol"
    Write-Host "Next step: switch OpenDots to cxa/gpt-5.6-sol."
    exit 0
}

if ($test.Body -match "not signed|login|authentication|auth") {
    Write-Host ""
    Write-Host "CODEX_APP_SERVER_REACHABLE_AUTH_REQUIRED" -ForegroundColor Yellow
    Write-Host "Transport is configured, but Codex authentication needs refresh."
    Write-Host "Run: codex login --device-auth"
    exit 20
}

Write-Host ""
Write-Host "CODEX_APP_SERVER_CONFIGURED_BUT_TEST_FAILED" -ForegroundColor Red
exit 21