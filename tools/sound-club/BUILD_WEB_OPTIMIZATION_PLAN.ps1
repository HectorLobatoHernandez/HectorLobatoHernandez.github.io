$ErrorActionPreference = "Stop"

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\\..")).Path
$candidate = Join-Path $repo "assets\\models\\sound-club\\_candidate"
$analysis = Join-Path $candidate "venue-master.analysis.json"
$script = Join-Path $PSScriptRoot "build_web_optimization_plan.py"

if (-not (Test-Path $analysis)) { throw "Analysis JSON not found: $analysis" }

$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if (-not $py) { throw "Python is required." }

Write-Host "Preflight: Python syntax check..."
& $py.Source -m py_compile $script
if ($LASTEXITCODE -ne 0) { throw "Optimization planner syntax check failed." }

& $py.Source $script $analysis `
  --json (Join-Path $candidate "venue-master.optimization-plan.json") `
  --csv (Join-Path $candidate "venue-master.optimization-plan.csv")

if ($LASTEXITCODE -ne 0) { throw "Optimization plan generation failed." }
