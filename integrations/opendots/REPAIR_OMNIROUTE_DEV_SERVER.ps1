param(
    [string]$OmniRoot = "C:\GitHub\OmniRoute",
    [int]$Port = 20128
)

$ErrorActionPreference = "Stop"

function Get-Listener {
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1
}

function Get-OmniProcesses {
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object {
            $_.CommandLine -and (
                $_.CommandLine -like "*C:\GitHub\OmniRoute*" -or
                $_.CommandLine -like "*scripts/dev/run-next.mjs*" -or
                $_.CommandLine -like "*scripts\\dev\\run-next.mjs*"
            )
        }
}

Write-Host "=== RHB STUDIO - OmniRoute dev-server repair ===" -ForegroundColor Cyan

if (-not (Test-Path $OmniRoot)) {
    throw "OmniRoute root not found: $OmniRoot"
}

$listener = Get-Listener
if ($listener) {
    Write-Host "OmniRoute is already listening on :$Port (PID $($listener.OwningProcess)). Nothing to repair." -ForegroundColor Green
    exit 0
}

Write-Host "No listener on :$Port."
Write-Host ""
Write-Host "OmniRoute-related processes before repair:" -ForegroundColor Cyan
$procs = @(Get-OmniProcesses)
if ($procs.Count -eq 0) {
    Write-Host "  none"
} else {
    $procs | Select-Object ProcessId,ParentProcessId,Name,CommandLine | Format-List
}

# Stop only processes whose command line identifies them as this OmniRoute dev runner/repo.
foreach ($proc in $procs) {
    try {
        Write-Host "Stopping OmniRoute process tree PID $($proc.ProcessId)..."
        & taskkill.exe /PID $proc.ProcessId /T /F 2>$null | Out-Null
    } catch {
        Write-Warning "Could not stop PID $($proc.ProcessId): $($_.Exception.Message)"
    }
}

Start-Sleep -Seconds 2

if (Get-Listener) {
    throw "Unexpected listener appeared on :$Port during repair. Stop here and inspect before continuing."
}

$lockCandidates = @(
    (Join-Path $OmniRoot ".build\next\dev\lock"),
    (Join-Path $OmniRoot ".next\dev\lock")
)

foreach ($lock in $lockCandidates) {
    if (-not (Test-Path $lock)) { continue }

    $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backup = "$lock.stale_$stamp"

    try {
        Move-Item -LiteralPath $lock -Destination $backup -Force
        Write-Host "Moved stale Next lock:" -ForegroundColor Yellow
        Write-Host "  $lock"
        Write-Host "  -> $backup"
    } catch {
        throw "Could not move Next lock '$lock'. A process may still hold it. $($_.Exception.Message)"
    }
}

# Do not purge caches automatically. Keep the repair minimal and reversible.
$devLog = Join-Path $OmniRoot ".build\next\dev\logs\next-development.log"

Write-Host ""
Write-Host "Starting a clean OmniRoute dev server..." -ForegroundColor Cyan

$cmd = @"
Set-Location -LiteralPath '$OmniRoot'
\$env:OMNIROUTE_USE_TURBOPACK='0'
\$env:PORT='$Port'
npm run dev
"@

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy","Bypass",
    "-Command",$cmd
)

$listener = $null
for ($i=0; $i -lt 90; $i++) {
    Start-Sleep -Seconds 1
    $listener = Get-Listener
    if ($listener) { break }
}

if (-not $listener) {
    Write-Host ""
    Write-Host "OmniRoute still did not bind :$Port." -ForegroundColor Red

    if (Test-Path $devLog) {
        Write-Host ""
        Write-Host "Last 80 lines of Next development log:" -ForegroundColor Yellow
        Get-Content $devLog -Tail 80 -ErrorAction SilentlyContinue
    }

    Write-Host ""
    Write-Host "Remaining OmniRoute-related processes:" -ForegroundColor Yellow
    Get-OmniProcesses | Select-Object ProcessId,ParentProcessId,Name,CommandLine | Format-List

    throw "OmniRoute repair failed before TCP bind."
}

Write-Host "OmniRoute is listening on :$Port (PID $($listener.OwningProcess))." -ForegroundColor Green

$healthUrl = "http://127.0.0.1:$Port/api/monitoring/health"
$healthy = $false
for ($i=0; $i -lt 60; $i++) {
    try {
        $h = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 3
        if ($h.status -eq "healthy") {
            $healthy = $true
            Write-Host "Health: healthy" -ForegroundColor Green
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
}

if (-not $healthy) {
    Write-Warning "TCP :$Port is listening but the health endpoint is not healthy yet."
    if (Test-Path $devLog) {
        Write-Host "Last 40 lines of Next log:"
        Get-Content $devLog -Tail 40 -ErrorAction SilentlyContinue
    }
    exit 2
}

Write-Host ""
Write-Host "Repair complete. OmniRoute is ready for OpenDots synchronization." -ForegroundColor Green
