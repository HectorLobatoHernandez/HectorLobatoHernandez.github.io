param(
  [Parameter(Mandatory=$true)]
  [string]$SkpPath,

  [switch]$Promote,
  [switch]$NoTextures
)

$ErrorActionPreference = "Stop"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$pythonScript = Join-Path $PSScriptRoot "convert_skp_to_glb.py"
$candidateDir = Join-Path $repo "assets\models\sound-club\_candidate"
$candidate = Join-Path $candidateDir "venue-master.glb"
$report = Join-Path $candidateDir "venue-master.qa.json"
$manifest = Join-Path $repo "xxxia-studio\projects\sound-club-palma\05_metadata\model-manifest.json"
$publicGlb = Join-Path $repo "assets\models\sound-club\venue-master.glb"

if (-not (Test-Path -LiteralPath $SkpPath)) {
  throw "SKP not found: $SkpPath"
}

New-Item -ItemType Directory -Force -Path $candidateDir | Out-Null

$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) {
  $py = Get-Command py -ErrorAction SilentlyContinue
}
if (-not $py) {
  throw "Python 3.10+ is required."
}

Write-Host "=== SOUND CLUB / PRIVATE SKP -> GLB ==="
Write-Host "Source stays local: $SkpPath"
Write-Host "Installing pinned OpenSKP conversion stack..."

& $py.Source -m pip install --upgrade "openskp==1.3.0" "trimesh>=3.0" "shapely>=1.8" "defusedxml>=0.7.1" "mapbox-earcut>=1.0" "pillow>=12.3.0"
if ($LASTEXITCODE -ne 0) { throw "Python dependency install failed." }

$argsList = @(
  $pythonScript,
  $SkpPath,
  "--output", $candidate,
  "--report", $report
)
if ($NoTextures) { $argsList += "--no-textures" }
if ($Promote) {
  $argsList += @(
    "--promote-manifest",
    "--manifest", $manifest,
    "--public-output", $publicGlb
  )
}

& $py.Source @argsList
if ($LASTEXITCODE -ne 0) { throw "SKP -> GLB conversion failed." }

Write-Host ""
if ($Promote) {
  Write-Host "PROMOTED after explicit -Promote flag."
  Write-Host "Public GLB: $publicGlb"
} else {
  Write-Host "Candidate only. Inspect it before promotion."
  Write-Host "To promote after QA:"
  Write-Host "  .\tools\sound-club\CONVERT_SKP_TO_GLB.ps1 -SkpPath `"$SkpPath`" -Promote"
}
Write-Host "QA report: $report"
