param(
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$candidate = Join-Path $repo "assets\models\sound-club\_candidate"
$source = Join-Path $candidate "venue-master.glb"
$plan = Join-Path $candidate "venue-master.optimization-plan.json"
$output = Join-Path $candidate "venue-web-v1.glb"
$report = Join-Path $candidate "venue-web-v1.build-report.json"
$script = Join-Path $PSScriptRoot "build_web_v1_lossless.py"

$expectedSourceSha = "0fc257b69448ed23739dceada7798113cc4dcdc457ec86efd8661902b9604135"

if (-not (Test-Path $source)) { throw "Source GLB not found: $source" }
if (-not (Test-Path $plan)) { throw "Optimization plan not found: $plan" }

if ((Test-Path $output) -and -not $Force) {
  if (-not (Test-Path $report)) {
    throw "venue-web-v1.glb already exists but its build report is missing: $report"
  }

  Write-Host "=== SOUND CLUB · venue-web-v1 ALREADY BUILT ==="
  Write-Host "Protected source remains unchanged."
  Write-Host "Existing derivative: $output"
  Write-Host "Existing build report: $report"
  Write-Host ""

  $status = Get-Content $report -Raw | ConvertFrom-Json

  [pscustomobject]@{
    SizeMiB              = [math]::Round([double]$status.derived.sizeMiB, 2)
    Nodes                = [int64]$status.derived.nodes
    Meshes               = [int64]$status.derived.meshes
    BinMiB               = [math]::Round(([double]$status.derived.binBytes / 1MB), 2)
    FileReductionPercent = [math]::Round([double]$status.reduction.filePercent, 2)
    BinReductionPercent  = [math]::Round([double]$status.reduction.binPercent, 2)
    MeshReductionPercent = [math]::Round([double]$status.reduction.meshDefinitionPercent, 2)
    WebSizeOK            = [bool]$status.webGate.sizeOk
    WebMeshCountOK       = [bool]$status.webGate.meshCountOk
    WebReady             = [bool]$status.webGate.ready
  } | Format-List

  Write-Host "V1 is complete. Do not rebuild it and do not use -Force unless the existing derivative is intentionally being replaced."
  Write-Host "Next stage: controlled V2 merge/proxy/simplification."
  return
}

$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if (-not $py) { throw "Python is required." }

Write-Host "=== SOUND CLUB · BUILD venue-web-v1 ==="
Write-Host "Source is protected: venue-master.glb"
Write-Host "Output is separate: venue-web-v1.glb"
Write-Host "Operations: safe decor/hardware drop + verified translation-equivalent mesh reuse"
Write-Host ""

Write-Host "Preflight: Python syntax check..."
& $py.Source -m py_compile $script
if ($LASTEXITCODE -ne 0) { throw "venue-web-v1 builder syntax check failed." }

$argsList = @(
  $script,
  $source,
  $plan,
  "--output", $output,
  "--report", $report,
  "--expected-source-sha", $expectedSourceSha,
  "--tolerance-mm", "0.001"
)

if ($Force) { $argsList += "--force" }

& $py.Source @argsList
if ($LASTEXITCODE -ne 0) { throw "venue-web-v1 build failed." }

Write-Host ""
Write-Host "Build report: $report"
Write-Host "DO NOT promote yet. venue-web-v1 is an intermediate local derivative."
