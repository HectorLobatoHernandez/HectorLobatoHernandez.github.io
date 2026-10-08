param(
  [switch]$Build
)

$ErrorActionPreference = "Stop"

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\\..")).Path
$candidate = Join-Path $repo "assets\\models\\sound-club\\_candidate"
$glb = Join-Path $candidate "venue-master.glb"
$plan = Join-Path $candidate "venue-master.optimization-plan.json"
$output = Join-Path $candidate "venue-web-v1.glb"
$report = Join-Path $candidate "venue-web-v1.trim-report.json"
$script = Join-Path $PSScriptRoot "trim_glb_streaming.py"

if (-not (Test-Path $glb)) { throw "Source GLB not found: $glb" }
if (-not (Test-Path $plan)) { throw "Optimization plan not found: $plan" }

$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if (-not $py) { throw "Python is required." }

Write-Host "Preflight: Python syntax check..."
& $py.Source -m py_compile $script
if ($LASTEXITCODE -ne 0) { throw "Streaming trimmer syntax check failed." }

$argsList = @(
  $script,
  $glb,
  $plan,
  "--output", $output,
  "--report", $report
)
if ($Build) { $argsList += "--build" }

if ($Build) {
  Write-Host "Mode: BUILD derived venue-web-v1.glb"
} else {
  Write-Host "Mode: DRY-RUN only. No GLB will be written."
}

& $py.Source @argsList
if ($LASTEXITCODE -ne 0) { throw "Streaming trim failed." }

Write-Host ""
Write-Host "Report: $report"
if (-not $Build) {
  Write-Host "If the projection is acceptable, rerun with -Build."
}
