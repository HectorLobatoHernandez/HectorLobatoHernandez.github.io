param(
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$candidate = Join-Path $repo "assets\models\sound-club\_candidate"
$v2 = Join-Path $candidate "venue-web-v2.glb"
$v2Report = Join-Path $candidate "venue-web-v2.build-report.json"
$v3 = Join-Path $candidate "venue-web-v3.glb"
$v3Report = Join-Path $candidate "venue-web-v3.build-report.json"
$script = Join-Path $PSScriptRoot "build_web_v3_venue_crop.py"

foreach ($required in @($v2, $v2Report)) {
  if (-not (Test-Path $required)) { throw "Required input not found: $required" }
}

if ((Test-Path $v3) -and -not $Force) {
  if (-not (Test-Path $v3Report)) {
    throw "venue-web-v3.glb exists but its report is missing: $v3Report"
  }

  Write-Host "=== SOUND CLUB · venue-web-v3 ALREADY BUILT ==="
  $status = Get-Content $v3Report -Raw | ConvertFrom-Json

  [pscustomobject]@{
    SizeMiB          = [math]::Round([double]$status.derivedV3.sizeMiB, 2)
    BinMiB           = [math]::Round([double]$status.derivedV3.binMiB, 2)
    Nodes            = [int64]$status.derivedV3.nodes
    Meshes           = [int64]$status.derivedV3.meshes
    CroppedMeshes    = [int64]$status.derivedV3.croppedMeshes
    ExtentX_M        = [math]::Round([double]$status.derivedV3.extentM[0], 2)
    ExtentY_M        = [math]::Round([double]$status.derivedV3.extentM[1], 2)
    ExtentZ_M        = [math]::Round([double]$status.derivedV3.extentM[2], 2)
    SizeOK           = [bool]$status.webGate.sizeOk
    MeshCountOK      = [bool]$status.webGate.meshCountOk
    BoundsOK         = [bool]$status.webGate.boundsOk
    ReadyForVisualQA = [bool]$status.webGate.readyForVisualQA
    Status           = [string]$status.webGate.status
  } | Format-List

  Write-Host "V3 already exists. Do not use -Force unless intentionally replacing it."
  return
}

$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if (-not $py) { throw "Python is required." }

Write-Host "=== SOUND CLUB · BUILD venue-web-v3 ==="
Write-Host "Input V2 is protected: venue-web-v2.glb"
Write-Host "Output is separate: venue-web-v3.glb"
Write-Host "Mode: dense-core venue crop with triangle-safe partial-mesh handling"
Write-Host ""

Write-Host "Preflight: Python syntax check..."
& $py.Source -m py_compile $script
if ($LASTEXITCODE -ne 0) { throw "venue-web-v3 builder syntax check failed." }

$argsList = @(
  $script,
  $v2,
  $v2Report,
  "--output", $v3,
  "--report", $v3Report
)
if ($Force) { $argsList += "--force" }

& $py.Source @argsList
if ($LASTEXITCODE -ne 0) { throw "venue-web-v3 build failed." }

Write-Host ""
Write-Host "Build report: $v3Report"
Write-Host "DO NOT promote. If numeric gates pass, next step is visual QA."
