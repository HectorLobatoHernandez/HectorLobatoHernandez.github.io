$ErrorActionPreference = "Stop"

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\\..")).Path
$candidate = Join-Path $repo "assets\\models\\sound-club\\_candidate"
$glb = Join-Path $candidate "venue-master.glb"
$report = Join-Path $candidate "venue-master.translation-instances.json"
$script = Join-Path $PSScriptRoot "analyze_translation_instances.py"

if (-not (Test-Path $glb)) { throw "GLB not found: $glb" }

$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if (-not $py) { throw "Python is required." }

Write-Host "Preflight: Python syntax check..."
& $py.Source -m py_compile $script
if ($LASTEXITCODE -ne 0) { throw "Translation-instance analyzer syntax check failed." }

Write-Host "Mode: translation-equivalence analysis only. No GLB will be written."
Write-Host "Tolerance: 0.001 mm. This may take several minutes."
& $py.Source $script $glb --json $report --tolerance-mm 0.001
if ($LASTEXITCODE -ne 0) { throw "Translation-instance analysis failed." }

Write-Host ""
Write-Host "Report: $report"
