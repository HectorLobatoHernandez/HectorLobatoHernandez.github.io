param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [switch]$SkipManifestUpdate
)
$ErrorActionPreference = "Stop"

function Find-Blender {
  $cmd=Get-Command blender -ErrorAction SilentlyContinue
  if($cmd){return $cmd.Source}
  $roots=@("$env:ProgramFiles\Blender Foundation","$env:LOCALAPPDATA\Programs\Blender Foundation")
  foreach($root in $roots){
    if(Test-Path $root){
      $hit=Get-ChildItem $root -Filter blender.exe -Recurse -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1
      if($hit){return $hit.FullName}
    }
  }
  throw "Blender executable not found. Install/verify Blender 4.5+ first."
}

$blender=Find-Blender
$script=Join-Path $RepoRoot "tools\blender\GAZA_BUILD_WORKER_GLBS.py"
$outDir=Join-Path $RepoRoot "apps\gaza\assets\3d\generated"
$out=Join-Path $outDir "worker_demo.glb"
$manifestPath=Join-Path $RepoRoot "apps\gaza\assets\3d\manifest.json"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Write-Host "Blender: $blender" -ForegroundColor Cyan
Write-Host "Generating: $out" -ForegroundColor Cyan
& $blender --background --factory-startup --python $script -- $out
if($LASTEXITCODE -ne 0){throw "Blender GLB build failed with exit code $LASTEXITCODE"}
if(!(Test-Path $out)){throw "Expected GLB was not created: $out"}
$size=(Get-Item $out).Length
if($size -lt 1024){throw "Generated GLB is unexpectedly small ($size bytes)"}

if(!$SkipManifestUpdate){
  $manifest=Get-Content $manifestPath -Raw | ConvertFrom-Json
  $assets=@($manifest.assets | Where-Object { $_.id -ne "worker-demo-v1" })
  $entry=[pscustomobject]@{
    id="worker-demo-v1"
    name="GAZA Worker Demo v1"
    path="assets/3d/generated/worker_demo.glb"
    sourceUrl="https://github.com/HectorLobatoHernandez/HectorLobatoHernandez.github.io/blob/main/tools/blender/GAZA_BUILD_WORKER_GLBS.py"
    license="Project-created"
    provenance="SIMULATED"
    targetGroup="workers"
    enabled=$true
    clickable=$true
    castShadow=$true
    receiveShadow=$true
    position=@(0,0,0)
    rotation=@(0,0,0)
    scale=@(2.2,2.2,2.2)
    animation="Walk"
    playAnimation=$true
    kind="PERSONAL SINTETICO GLB"
    info="Trabajador ficticio generado por Blender para validar el pipeline GLB; no representa a un empleado real."
  }
  $manifest.assets=@($assets)+@($entry)
  $json=$manifest | ConvertTo-Json -Depth 20
  $utf8NoBom=New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($manifestPath,$json,$utf8NoBom)
  Write-Host "Manifest updated locally: $manifestPath" -ForegroundColor Green
}

Write-Host ("GAZA GLB generated: {0:N0} bytes" -f $size) -ForegroundColor Green
Write-Host "Next: cd apps\gaza ; npm run qa" -ForegroundColor Yellow
Write-Host "Commit the GLB + manifest only after QA passes." -ForegroundColor Yellow
