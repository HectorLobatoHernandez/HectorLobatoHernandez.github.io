$ErrorActionPreference = "Stop"

$Repo="$env:USERPROFILE\Desktop\HectorLobatoHernandez.github.io"
$AvatarDir=Join-Path $Repo "assets\models\avatar"
$Input=Join-Path $AvatarDir "hector-avatar-v2.glb"
$Output=Join-Path $AvatarDir "hector-avatar-v2-master-v1.glb"
$Backup=Join-Path $AvatarDir "hector-avatar-v2.original-backup.glb"
$Py=Join-Path $Repo "tools\avatar\REFINE_RHB_AVATAR_MASTER.py"

if (-not (Test-Path $Input)) { throw "MASTER_AVATAR_NOT_FOUND: $Input" }
if (-not (Test-Path $Py)) { throw "REFINE_SCRIPT_NOT_FOUND: $Py" }

if (-not (Test-Path $Backup)) {
  Copy-Item $Input $Backup -Force
}

$TripPython="$env:USERPROFILE\Desktop\RHB_TripoSR\.venv\Scripts\python.exe"
if(Test-Path $TripPython){
  $Python=$TripPython
}else{
  $Python=(Get-Command python -ErrorAction Stop).Source
}
& $Python $Py $Input $Output
if ($LASTEXITCODE -ne 0) { throw "MASTER_REFINEMENT_FAILED_$LASTEXITCODE" }
if (-not (Test-Path $Output)) { throw "REFINED_MASTER_NOT_CREATED" }

# Delete permanently the malformed auto-rig derivative and related local variants.
$trash=@(
  (Join-Path $AvatarDir "hector-avatar-v2-rigged.glb"),
  (Join-Path $AvatarDir "hector-avatar-v2-rigged-hairfix.glb")
)
foreach($f in $trash){
  if(Test-Path $f){
    Remove-Item $f -Force
    Write-Host "DELETED=$f" -ForegroundColor DarkYellow
  }
}

Write-Host ""
Write-Host "RHB_AVATAR_MASTER_V1_READY=True" -ForegroundColor Green
Write-Host "MASTER=$Output" -ForegroundColor Green
Write-Host "BACKUP=$Backup" -ForegroundColor DarkGray
