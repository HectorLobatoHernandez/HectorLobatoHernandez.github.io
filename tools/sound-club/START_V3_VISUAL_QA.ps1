$ErrorActionPreference = "Stop"

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$candidate = Join-Path $repo "assets\models\sound-club\_candidate"
$v3 = Join-Path $candidate "venue-web-v3.glb"
$report = Join-Path $candidate "venue-web-v3.build-report.json"

if (-not (Test-Path $v3)) { throw "V3 GLB not found: $v3" }
if (-not (Test-Path $report)) { throw "V3 build report not found: $report" }

$status = Get-Content $report -Raw | ConvertFrom-Json
$expectedSha = [string]$status.derivedV3.sha256
if (-not $expectedSha) { throw "V3 report does not contain derivedV3.sha256." }

$actualSha = (Get-FileHash -Algorithm SHA256 $v3).Hash.ToLowerInvariant()
if ($actualSha -ne $expectedSha.ToLowerInvariant()) {
  throw "V3 SHA mismatch. Expected $expectedSha but got $actualSha"
}

if (-not [bool]$status.webGate.allNumericGatesPassed) {
  throw "V3 numeric gates are not all passed. Visual QA launcher blocked."
}

Write-Host "=== SOUND CLUB · V3 VISUAL QA ==="
Write-Host "V3 SHA verified."
Write-Host ""

[pscustomobject]@{
  SizeMiB          = [math]::Round([double]$status.derivedV3.sizeMiB, 2)
  Nodes            = [int64]$status.derivedV3.nodes
  Meshes           = [int64]$status.derivedV3.meshes
  ExtentX_M        = [math]::Round([double]$status.derivedV3.extentM[0], 2)
  ExtentY_M        = [math]::Round([double]$status.derivedV3.extentM[1], 2)
  ExtentZ_M        = [math]::Round([double]$status.derivedV3.extentM[2], 2)
  SizeOK           = [bool]$status.webGate.sizeOk
  MeshCountOK      = [bool]$status.webGate.meshCountOk
  BoundsOK         = [bool]$status.webGate.boundsOk
  ReadyForVisualQA = [bool]$status.webGate.readyForVisualQA
} | Format-List

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) { $python = Get-Command py -ErrorAction SilentlyContinue }
if (-not $python) { throw "Python is required to start the local HTTP server." }

$listener = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue

if (-not $listener) {
  $safeRepo = $repo.Replace("'", "''")
  $serverCommand = "Set-Location -LiteralPath '$safeRepo'; & '$($python.Source)' -m http.server 8000"
  Write-Host "Starting local HTTP server on port 8000..."
  Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $serverCommand
  ) | Out-Null
  Start-Sleep -Seconds 2
} else {
  Write-Host "Port 8000 is already listening; reusing existing local server."
}

$url = "http://localhost:8000/projects/sound-club-palma.html?candidate=v3"
Write-Host ""
Write-Host "Opening:"
Write-Host $url
Write-Host ""
Write-Host "QA checklist:"
Write-Host "  1. Venue envelope / no remote context"
Write-Host "  2. Ceiling and principal architecture"
Write-Host "  3. Curtains / acoustic elements"
Write-Host "  4. DJ booth and technical furniture"
Write-Host "  5. Lighting / suspended structure"
Write-Host "  6. Scale, clipping, camera orbit and obvious missing geometry"
Write-Host ""
Write-Host "Do not promote yet."

Start-Process $url
