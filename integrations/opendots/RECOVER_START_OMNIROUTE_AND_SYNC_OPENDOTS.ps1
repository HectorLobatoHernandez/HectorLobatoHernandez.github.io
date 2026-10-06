param(
    [string]$OmniLauncher = "C:\Users\us_es\Desktop\XXXIA STUDIO CORE\XXXIA_RUNTIME_SMOKE_TEST_V0_4_1\scripts\01_START_OMNIROUTE.ps1",
    [string]$RhbSettings = "C:\Users\us_es\Desktop\RHB STUDIO  CORE IA\100_RHB_STUDIO\settings.json",
    [string]$OpenDotsDir = "$env:USERPROFILE\Desktop\RHB_STUDIO_OPENDOTS"
)

$ErrorActionPreference = "Stop"

function Set-EnvValue([string]$Path, [string]$Name, [string]$Value) {
    $lines = @()
    if (Test-Path $Path) { $lines = Get-Content $Path }
    $escaped = [regex]::Escape($Name)
    $found = $false
    $out = foreach ($line in $lines) {
        if ($line -match "^$escaped=") {
            $found = $true
            "$Name=$Value"
        } else {
            $line
        }
    }
    if (-not $found) { $out += "$Name=$Value" }
    Set-Content -Path $Path -Value $out -Encoding UTF8
}

function Get-EnvValue([string]$Path, [string]$Name) {
    if (-not (Test-Path $Path)) { return "" }
    $line = Get-Content $Path | Where-Object { $_ -match ("^" + [regex]::Escape($Name) + "=") } | Select-Object -First 1
    if (-not $line) { return "" }
    return $line.Substring($Name.Length + 1)
}

Write-Host "=== RHB STUDIO · OmniRoute -> OpenDots recovery ===" -ForegroundColor Cyan

foreach ($required in @($OmniLauncher,$RhbSettings,(Join-Path $OpenDotsDir ".env"))) {
    if (-not (Test-Path $required)) { throw "Required path not found: $required" }
}

$cfg = Get-Content $RhbSettings -Raw -Encoding UTF8 | ConvertFrom-Json
$base = ([string]$cfg.omniroute.base_url).TrimEnd("/")
$healthEndpoint = [string]$cfg.omniroute.health_endpoint
$keyEnv = [string]$cfg.omniroute.api_key_env

if ([string]::IsNullOrWhiteSpace($base)) { throw "settings.json has no omniroute.base_url" }
if ([string]::IsNullOrWhiteSpace($healthEndpoint)) { $healthEndpoint = "/api/monitoring/health" }
if ([string]::IsNullOrWhiteSpace($keyEnv)) { throw "settings.json has no omniroute.api_key_env" }

$key = [Environment]::GetEnvironmentVariable($keyEnv,"User")
if (-not $key) { $key = [Environment]::GetEnvironmentVariable($keyEnv,"Process") }
if (-not $key) { throw "OmniRoute API key environment variable '$keyEnv' is not defined." }

$healthUrl = if ($healthEndpoint.StartsWith("/")) { "$base$healthEndpoint" } else { "$base/$healthEndpoint" }
$openAiBase = if ($base -match "/v1$") { $base } else { "$base/v1" }

$openDotsEnv = Join-Path $OpenDotsDir ".env"
$currentModel = Get-EnvValue $openDotsEnv "OPENAI_MODEL"
if ([string]::IsNullOrWhiteSpace($currentModel)) { $currentModel = "auto/best-coding" }

Write-Host "OmniRoute base: $base"
Write-Host "Health URL: $healthUrl"
Write-Host "OpenAI-compatible base: $openAiBase"
Write-Host "API key source: USER ENV '$keyEnv' (secret not displayed)"
Write-Host "OpenDots candidate model: $currentModel"

$already = Get-NetTCPConnection -LocalPort 20128 -State Listen -ErrorAction SilentlyContinue
if (-not $already) {
    Write-Host "Starting OmniRoute with canonical launcher..."
    & $OmniLauncher
}

$healthy = $false
$health = $null
for ($i=0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 1
    try {
        $health = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 3
        if ($health.status -eq "healthy") {
            $healthy = $true
            break
        }
    } catch {}
}
if (-not $healthy) {
    throw "OmniRoute did not report healthy on $healthUrl. Inspect the OmniRoute PowerShell window."
}

Write-Host "OmniRoute HEALTHY." -ForegroundColor Green

$headers = @{ Authorization = "Bearer $key" }

Write-Host "Reading /v1/models..."
$modelsResponse = Invoke-RestMethod -Uri "$openAiBase/models" -Headers $headers -TimeoutSec 15
$modelIds = @($modelsResponse.data | ForEach-Object { [string]$_.id } | Where-Object { $_ })

if ($modelIds.Count -gt 0) {
    Write-Host ("Models returned: " + ($modelIds -join ", "))
} else {
    Write-Warning "/v1/models returned no model IDs."
}

$candidates = New-Object System.Collections.Generic.List[string]
foreach ($candidate in @(
    $currentModel,
    [string]$cfg.omniroute.model,
    "auto/best-coding"
)) {
    if (-not [string]::IsNullOrWhiteSpace($candidate) -and -not $candidates.Contains($candidate)) {
        $candidates.Add($candidate)
    }
}

$workingModel = $null
foreach ($candidate in $candidates) {
    Write-Host "Testing chat model: $candidate"
    try {
        $body = @{
            model = $candidate
            messages = @(@{ role = "user"; content = "Reply only with: RHB_OK" })
            max_tokens = 16
        } | ConvertTo-Json -Depth 8

        $reply = Invoke-RestMethod -Method Post -Uri "$openAiBase/chat/completions" -Headers $headers -ContentType "application/json" -Body $body -TimeoutSec 45
        $text = [string]$reply.choices[0].message.content
        if ($reply.choices -and $text) {
            $workingModel = $candidate
            Write-Host "Chat-completions OK with $candidate -> $text" -ForegroundColor Green
            break
        }
    } catch {
        Write-Warning ("Model test failed for " + $candidate + ": " + $_.Exception.Message)
    }
}

if (-not $workingModel) {
    Write-Host ""
    Write-Host "Available model IDs from /v1/models:" -ForegroundColor Yellow
    $modelIds | ForEach-Object { Write-Host "  $_" }
    throw "No tested chat model produced a valid chat-completions response. OpenDots .env was not changed."
}

Write-Host "Synchronizing OpenDots .env..." -ForegroundColor Cyan
Set-EnvValue $openDotsEnv "OPENAI_API_KEY" $key
Set-EnvValue $openDotsEnv "OPENAI_BASE_URL" $openAiBase
Set-EnvValue $openDotsEnv "OPENAI_MODEL" $workingModel

Write-Host "Stopping only OpenDots processes before reload..."
$openDotsProcesses = Get-CimInstance Win32_Process | Where-Object {
    $_.ProcessId -ne $PID -and
    $_.CommandLine -and
    $_.CommandLine -like "*RHB_STUDIO_OPENDOTS*" -and
    $_.Name -match "^(node|cmd|powershell)(\.exe)?$"
}
foreach ($p in $openDotsProcesses) {
    try { Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop } catch {}
}

Start-Sleep -Seconds 2

Write-Host "Restarting OpenDots..."
$cmd = "Set-Location -LiteralPath '$OpenDotsDir'; npm run dev"
Start-Process powershell.exe -ArgumentList "-NoExit","-ExecutionPolicy","Bypass","-Command",$cmd

$openDotsReady = $false
for ($i=0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 1
    try {
        $workspace = Invoke-RestMethod -Uri "http://127.0.0.1:4310/api/workspace" -TimeoutSec 2
        $openDotsReady = $true
        break
    } catch {}
}

if (-not $openDotsReady) { throw "OpenDots did not come back on :4310." }

Write-Host ""
Write-Host "=== FINAL STATUS ===" -ForegroundColor Cyan
@(
    [pscustomobject]@{ Service="OmniRoute"; Port=20128; Listening=[bool](Get-NetTCPConnection -LocalPort 20128 -State Listen -ErrorAction SilentlyContinue) },
    [pscustomobject]@{ Service="OpenClaw"; Port=18789; Listening=[bool](Get-NetTCPConnection -LocalPort 18789 -State Listen -ErrorAction SilentlyContinue) },
    [pscustomobject]@{ Service="NEXO CORE"; Port=20800; Listening=[bool](Get-NetTCPConnection -LocalPort 20800 -State Listen -ErrorAction SilentlyContinue) },
    [pscustomobject]@{ Service="OpenDots API"; Port=4310; Listening=[bool](Get-NetTCPConnection -LocalPort 4310 -State Listen -ErrorAction SilentlyContinue) },
    [pscustomobject]@{ Service="OpenDots UI"; Port=5173; Listening=[bool](Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue) }
) | Format-Table -AutoSize

Write-Host "OpenDots model: $workingModel"
Write-Host "OpenDots URL: http://127.0.0.1:5173"
Write-Host "Secret was synchronized locally and was not printed."
