$ErrorActionPreference = "Stop"

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\\..")).Path
$candidate = Join-Path $repo "assets\\models\\sound-club\\_candidate"
$glb = Join-Path $candidate "venue-master.glb"
$plan = Join-Path $candidate "venue-master.optimization-plan.json"
$report = Join-Path $candidate "venue-master.buffer-ownership.json"
$script = Join-Path $PSScriptRoot "analyze_buffer_ownership.py"

if (-not (Test-Path $glb)) { throw "GLB not found: $glb" }
if (-not (Test-Path $plan)) { throw "Optimization plan not found: $plan" }

$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if (-not $py) { throw "Python is required." }

Write-Host "Preflight: Python syntax check..."
& $py.Source -m py_compile $script
if ($LASTEXITCODE -ne 0) { throw "Buffer ownership analyzer syntax check failed." }

Write-Host "Mode: DRY-RUN ownership/scenario analysis only."
& $py.Source $script $glb $plan --json $report
if ($LASTEXITCODE -ne 0) { throw "Buffer ownership analysis failed." }

Write-Host ""
Write-Host "Report: $report"
