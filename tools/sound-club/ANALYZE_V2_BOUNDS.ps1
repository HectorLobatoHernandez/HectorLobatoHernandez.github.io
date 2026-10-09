$ErrorActionPreference = "Stop"

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$candidate = Join-Path $repo "assets\models\sound-club\_candidate"
$v2 = Join-Path $candidate "venue-web-v2.glb"
$report = Join-Path $candidate "venue-web-v2.bounds-analysis.json"
$script = Join-Path $PSScriptRoot "analyze_v2_bounds.py"

if (-not (Test-Path $v2)) { throw "V2 GLB not found: $v2" }

$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if (-not $py) { throw "Python is required." }

Write-Host "=== SOUND CLUB · V2 BOUNDS ISOLATION ==="
Write-Host "Mode: analysis only. No GLB will be modified."
Write-Host ""

Write-Host "Preflight: Python syntax check..."
& $py.Source -m py_compile $script
if ($LASTEXITCODE -ne 0) { throw "V2 bounds analyzer syntax check failed." }

& $py.Source $script $v2 --json $report
if ($LASTEXITCODE -ne 0) { throw "V2 bounds analysis failed." }

Write-Host ""
Write-Host "Bounds report: $report"
Write-Host "Next: use extrema/outlier groups to build venue-only V3."
