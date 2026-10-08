$ErrorActionPreference = "Stop"

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\\..")).Path
$glb = Join-Path $repo "assets\\models\\sound-club\\_candidate\\venue-master.glb"
$out = Join-Path $repo "assets\\models\\sound-club\\_candidate"
$script = Join-Path $PSScriptRoot "analyze_glb_candidate.py"

if (-not (Test-Path $glb)) { throw "Candidate GLB not found: $glb" }

$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if (-not $py) { throw "Python is required." }

Write-Host "Preflight: Python syntax check..."
& $py.Source -m py_compile $script
if ($LASTEXITCODE -ne 0) { throw "Analyzer Python syntax check failed." }

& $py.Source $script $glb `
  --json (Join-Path $out "venue-master.analysis.json") `
  --csv (Join-Path $out "venue-master.top-geometry.csv") `
  --grid-m 25 `
  --top 200

if ($LASTEXITCODE -ne 0) { throw "GLB analysis failed." }
