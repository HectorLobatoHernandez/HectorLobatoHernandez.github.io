$ErrorActionPreference="Stop"
$Repo="$env:USERPROFILE\Desktop\HectorLobatoHernandez.github.io"
$AvatarDir=Join-Path $Repo "assets\models\avatar"
$Meta=Join-Path $AvatarDir "hector-metaperson.glb"

if(-not (Test-Path $Meta)){
  throw "HECTOR_METAPERSON_NOT_FOUND: $Meta"
}

$patterns=@(
  "hector-avatar-v2.glb",
  "hector-avatar-v2.input.png",
  "hector-avatar-v2-master-v1.glb",
  "hector-avatar-v2-rigged.glb",
  "hector-avatar-v2-rigged-hairfix.glb"
)

foreach($name in $patterns){
  $p=Join-Path $AvatarDir $name
  if(Test-Path $p){
    Remove-Item $p -Force
    Write-Host "DELETED=$p" -ForegroundColor DarkYellow
  }
}

Write-Host "RHB_METAPERSON_BASE_OK=True" -ForegroundColor Green
Write-Host "ACTIVE=$Meta" -ForegroundColor Green
