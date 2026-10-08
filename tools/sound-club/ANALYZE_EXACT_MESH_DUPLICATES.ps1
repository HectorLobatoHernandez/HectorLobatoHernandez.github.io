$ErrorActionPreference = "Stop"

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\\..")).Path
$candidate = Join-Path $repo "assets\\models\\sound-club\\_candidate"
$glb = Join-Path $candidate "venue-master.glb"
$report = Join-Path $candidate "venue-master.exact-dedupe.json"
$script = Join-Path $PSScriptRoot "analyze_exact_mesh_duplicates.py"

if (-not (Test-Path $glb)) { throw "GLB not found: $glb" }

$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if (-not $py) { throw "Python is required." }

Write-Host "Preflight: Python syntax check..."
& $py.Source -m py_compile $script
if ($LASTEXITCODE -ne 0) { throw "Exact dedupe analyzer syntax check failed." }

Write-Host "Mode: lossless duplicate analysis only. No GLB will be written."
Write-Host "This may take several minutes because ~203k bufferViews are hashed."
& $py.Source $script $glb --json $report
if ($LASTEXITCODE -ne 0) { throw "Exact duplicate analysis failed." }

Write-Host ""
Write-Host "Report: $report"
