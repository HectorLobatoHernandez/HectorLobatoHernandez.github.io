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
