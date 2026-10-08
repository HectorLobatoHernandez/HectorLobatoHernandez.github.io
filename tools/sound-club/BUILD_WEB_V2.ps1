param(
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$candidate = Join-Path $repo "assets\models\sound-club\_candidate"
$v1 = Join-Path $candidate "venue-web-v1.glb"
$v1Report = Join-Path $candidate "venue-web-v1.build-report.json"
$plan = Join-Path $candidate "venue-master.optimization-plan.json"
$v2 = Join-Path $candidate "venue-web-v2.glb"
$v2Report = Join-Path $candidate "venue-web-v2.build-report.json"
$script = Join-Path $PSScriptRoot "build_web_v2_proxy.py"

foreach ($required in @($v1, $v1Report, $plan)) {
  if (-not (Test-Path $required)) { throw "Required input not found: $required" }
}

if ((Test-Path $v2) -and -not $Force) {
  if (-not (Test-Path $v2Report)) {
    throw "venue-web-v2.glb exists but its report is missing: $v2Report"
  }

  Write-Host "=== SOUND CLUB · venue-web-v2 ALREADY BUILT ==="
  $status = Get-Content $v2Report -Raw | ConvertFrom-Json

  [pscustomobject]@{
    SizeMiB              = [math]::Round([double]$status.derivedV2.sizeMiB, 2)
    BinMiB               = [math]::Round([double]$status.derivedV2.binMiB, 2)
    Nodes                = [int64]$status.derivedV2.nodes
    Meshes               = [int64]$status.derivedV2.meshes
    ProxyNodes           = [int64]$status.derivedV2.proxyNodes
    FileReductionPercent = [math]::Round([double]$status.reductionFromV1.filePercent, 2)
    MeshReductionPercent = [math]::Round([double]$status.reductionFromV1.meshPercent, 2)
    SizeOK               = [bool]$status.webGate.sizeOk
    MeshCountOK          = [bool]$status.webGate.meshCountOk
    BoundsOK             = [bool]$status.webGate.boundsOk
    ReadyForVisualQA     = [bool]$status.webGate.readyForVisualQA
    Status               = [string]$status.webGate.status
  } | Format-List

  Write-Host "V2 already exists. Do not use -Force unless intentionally replacing it."
  return
}

$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if (-not $py) { throw "Python is required." }

Write-Host "=== SOUND CLUB · BUILD venue-web-v2 ==="
Write-Host "Input V1 is protected: venue-web-v1.glb"
Write-Host "Output is separate: venue-web-v2.glb"
Write-Host "Mode: controlled P1 spatial proxies"
Write-Host ""

Write-Host "Preflight: Python syntax check..."
& $py.Source -m py_compile $script
if ($LASTEXITCODE -ne 0) { throw "venue-web-v2 builder syntax check failed." }

$argsList = @(
  $script,
  $v1,
  $plan,
  $v1Report,
  "--output", $v2,
  "--report", $v2Report
)
if ($Force) { $argsList += "--force" }

& $py.Source @argsList
if ($LASTEXITCODE -ne 0) { throw "venue-web-v2 build failed." }

Write-Host ""
Write-Host "Build report: $v2Report"
Write-Host "DO NOT promote. If the gate passes, V2 still requires visual QA."
