param(
    [string]$OmniRoot = "C:\GitHub\OmniRoute",
    [string]$OmniLauncher = "C:\Users\us_es\Desktop\XXXIA STUDIO CORE\XXXIA_RUNTIME_SMOKE_TEST_V0_4_1\scripts\01_START_OMNIROUTE.ps1",
    [int]$Port = 20128
)

$ErrorActionPreference = "Stop"
$BaseUrl = "http://127.0.0.1:$Port"

function Get-Listener {
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
}

function Test-Health {
    try {
        $r = Invoke-RestMethod "$BaseUrl/api/monitoring/health" -TimeoutSec 5
        return ($r.status -eq "healthy")
    } catch { return $false }
}

function Invoke-ChatProbe([string]$Model) {
    $payload = @{
        model = $Model
        messages = @(@{ role = "user"; content = "Reply only with RHB_OK" })
        max_tokens = 24
    } | ConvertTo-Json -Depth 8 -Compress

    try {
        $params = @{
            Method = "Post"
            Uri = "$BaseUrl/v1/chat/completions"
            ContentType = "application/json; charset=utf-8"
            Body = [Text.Encoding]::UTF8.GetBytes($payload)
            TimeoutSec = 45
            UseBasicParsing = $true
        }
        $r = Invoke-WebRequest @params
        return [pscustomobject]@{ Model=$Model; Http=[int]$r.StatusCode; Body=[string]$r.Content }
    }
    catch [System.Net.WebException] {
        $resp = $_.Exception.Response
        $code = 0
        $body = ""
        if ($resp) {
            try { $code = [int]$resp.StatusCode } catch {}
            try {
                $reader = New-Object IO.StreamReader($resp.GetResponseStream())
                try { $body = $reader.ReadToEnd() } finally { $reader.Dispose() }
            } catch {}
        }
        if (-not $body) { $body = $_.Exception.Message }
        return [pscustomobject]@{ Model=$Model; Http=$code; Body=$body }
    }
    catch { return [pscustomobject]@{ Model=$Model; Http=0; Body=$_.Exception.Message } }
}

Write-Host "=== RHB STUDIO - Stabilize OmniRoute + model matrix ===" -ForegroundColor Cyan

if (-not (Test-Path $OmniRoot)) { throw "OmniRoute root not found: $OmniRoot" }
if (-not (Test-Path $OmniLauncher)) { throw "OmniRoute launcher not found: $OmniLauncher" }

$listener = Get-Listener
if ($listener) {
    Write-Host "Listener detected on :$Port (PID $($listener.OwningProcess))."
    $healthy = $false
    foreach ($attempt in 1..3) {
        if (Test-Health) { $healthy = $true; break }
        Write-Host "Health attempt $attempt/3 failed."
        Start-Sleep -Seconds 2
    }

    if (-not $healthy) {
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)" -ErrorAction SilentlyContinue
        $cmdline = if ($proc) { [string]$proc.CommandLine } else { "" }
        Write-Host "Listener exists but health is unresponsive." -ForegroundColor Yellow
        if ($proc) {
            Write-Host "PID: $($proc.ProcessId)"
            Write-Host "Process: $($proc.Name)"
        }
        if ($cmdline -and $cmdline -notmatch [regex]::Escape($OmniRoot)) {
            throw "PID $($listener.OwningProcess) owns :$Port but is not identifiable as OmniRoute. Refusing to kill it."
        }
        Write-Host "Recycling stale OmniRoute process tree..." -ForegroundColor Yellow
        & taskkill.exe /PID $listener.OwningProcess /T /F | Out-Null
        Start-Sleep -Seconds 3
    }
} else {
    Write-Host "No listener on :$Port."
}

if (-not (Get-Listener)) {
    foreach ($lock in @((Join-Path $OmniRoot ".build\next\dev\lock"),(Join-Path $OmniRoot ".next\dev\lock"))) {
        if (Test-Path $lock) {
            $backup = "$lock.stale_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
            Move-Item -LiteralPath $lock -Destination $backup -Force
            Write-Host "Moved stale lock -> $backup"
        }
    }
    Write-Host "Starting OmniRoute with canonical launcher..." -ForegroundColor Cyan
    & $OmniLauncher
}

$ready = $false
foreach ($i in 1..90) {
    Start-Sleep -Seconds 1
    if ((Get-Listener) -and (Test-Health)) { $ready = $true; break }
    if (($i % 10) -eq 0) { Write-Host "Waiting for healthy OmniRoute... $i s" }
}
if (-not $ready) { throw "OmniRoute did not become healthy after recovery." }

$listener = Get-Listener
Write-Host "OmniRoute HEALTHY on :$Port (PID $($listener.OwningProcess))." -ForegroundColor Green

$models = @("ddgw/gpt-5.6-luna","unc/qwen3.6:27b","cxa/gpt-5.6-sol","cx/gpt-5.6-sol","auto/best-coding")
$results = @()
foreach ($model in $models) {
    Write-Host ""
    Write-Host "Testing $model ..." -ForegroundColor Cyan
    $r = Invoke-ChatProbe $model
    $results += $r
    $display = [string]$r.Body
    if ($display.Length -gt 1200) { $display = $display.Substring(0,1200) + "...<truncated>" }
    Write-Host "HTTP $($r.Http)"
    if ($display) { Write-Host $display }
}

Write-Host ""
Write-Host "=== RESULT MATRIX ===" -ForegroundColor Cyan
$results | Select-Object Model,Http,@{N="Class";E={
    $b=[string]$_.Body
    if ($_.Http -ge 200 -and $_.Http -lt 300) { "OK" }
    elseif ($_.Http -eq 401 -or $b -match "unauthorized|authentication|auth") { "AUTH" }
    elseif ($_.Http -eq 403) { "FORBIDDEN" }
    elseif ($_.Http -eq 404) { "NOT_FOUND" }
    elseif ($_.Http -eq 0 -and $b -match "timed out|tiempo de espera") { "TIMEOUT" }
    else { "ERROR" }
}} | Format-Table -AutoSize

$directOk = $results | Where-Object { $_.Model -in @("ddgw/gpt-5.6-luna","unc/qwen3.6:27b") -and $_.Http -ge 200 -and $_.Http -lt 300 } | Select-Object -First 1
$cxaOk = $results | Where-Object { $_.Model -eq "cxa/gpt-5.6-sol" -and $_.Http -ge 200 -and $_.Http -lt 300 } | Select-Object -First 1

Write-Host ""
if ($cxaOk) {
    Write-Host "CLASSIFICATION: CODEX_APP_SERVER_OK" -ForegroundColor Green
    Write-Host "Preferred OpenDots model: cxa/gpt-5.6-sol"
} elseif ($directOk) {
    Write-Host "CLASSIFICATION: CORE_INFERENCE_OK_CODEX_PATH_BROKEN" -ForegroundColor Yellow
    Write-Host "Working direct model: $($directOk.Model)"
    Write-Host "Next action: repair/sign in Codex App-Server."
} else {
    Write-Host "CLASSIFICATION: GENERAL_ROUTING_OR_PROVIDER_FAILURE" -ForegroundColor Red
    Write-Host "No direct no-auth model returned a successful chat response."
}