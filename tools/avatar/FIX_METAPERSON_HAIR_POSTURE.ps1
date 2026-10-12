$ErrorActionPreference="Stop"

$Repo="$env:USERPROFILE\Desktop\HectorLobatoHernandez.github.io"
$AvatarDir=Join-Path $Repo "assets\models\avatar"
$Input=Join-Path $AvatarDir "hector-metaperson.glb"
$Output=Join-Path $AvatarDir "hector-metaperson-fixed-v1.glb"
$Backup=Join-Path $AvatarDir "hector-metaperson.backup-before-hair-posture.glb"
$Script=Join-Path $Repo "tools\avatar\FIX_METAPERSON_HAIR_POSTURE.py"

if(-not (Test-Path $Input)){ throw "METAPERSON_NOT_FOUND: $Input" }
if(-not (Test-Path $Script)){ throw "SCRIPT_NOT_FOUND: $Script" }

if(-not (Test-Path $Backup)){
    Copy-Item $Input $Backup -Force
}

$TripPython="$env:USERPROFILE\Desktop\RHB_TripoSR\.venv\Scripts\python.exe"
if(Test-Path $TripPython){
    $Python=$TripPython
}else{
    $Python=(Get-Command python -ErrorAction Stop).Source
}

& $Python $Script $Input $Output
if($LASTEXITCODE -ne 0){ throw "METAPERSON_HAIR_POSTURE_FAILED_$LASTEXITCODE" }
if(-not (Test-Path $Output)){ throw "FIXED_METAPERSON_NOT_CREATED" }

Write-Host ""
Write-Host "RHB_METAPERSON_FIXED_V1_READY=True" -ForegroundColor Green
Write-Host "OUTPUT=$Output" -ForegroundColor Green
Write-Host "BACKUP=$Backup" -ForegroundColor DarkGray
