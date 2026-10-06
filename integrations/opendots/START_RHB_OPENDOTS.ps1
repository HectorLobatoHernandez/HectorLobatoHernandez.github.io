param(
    [string]$InstallDir = "$env:USERPROFILE\Desktop\RHB_STUDIO_OPENDOTS",
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path (Join-Path $InstallDir "package.json"))) {
    throw "OpenDots is not installed at $InstallDir"
}

$services = @(
    @{ Name = "OmniRoute"; Port = 20128 },
    @{ Name = "OpenClaw"; Port = 18789 },
    @{ Name = "NEXO CORE"; Port = 20800 }
)

foreach ($svc in $services) {
    $ok = Test-NetConnection -ComputerName 127.0.0.1 -Port $svc.Port -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($ok) {
        Write-Host ("{0} RUNNING :{1}" -f $svc.Name, $svc.Port)
    } else {
        Write-Warning ("{0} NOT LISTENING :{1}" -f $svc.Name, $svc.Port)
    }
}

$existing = Test-NetConnection -ComputerName 127.0.0.1 -Port 4310 -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $existing) {
    $cmd = "Set-Location -LiteralPath '$InstallDir'; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit","-ExecutionPolicy","Bypass","-Command",$cmd
}

$ready = $false
for ($i=0; $i -lt 45; $i++) {
    Start-Sleep -Seconds 1
    try {
        Invoke-RestMethod -Uri "http://127.0.0.1:4310/api/workspace" -TimeoutSec 2 | Out-Null
        $ready = $true
        break
    } catch {}
}

if (-not $ready) {
    throw "OpenDots API is not responding on port 4310."
}

Write-Host "OpenDots RUNNING :4310"
Write-Host "OpenDots UI :5173"

if (-not $NoBrowser) {
    Start-Process "http://127.0.0.1:5173"
}
