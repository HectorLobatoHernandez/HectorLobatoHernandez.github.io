$ErrorActionPreference = "Stop"

$Repo = "$env:USERPROFILE\Desktop\HectorLobatoHernandez.github.io"
$Input = Join-Path $Repo "assets\models\avatar\hector-avatar-v2.glb"
$Output = Join-Path $Repo "assets\models\avatar\hector-avatar-v2-rigged.glb"
$Py = Join-Path $Repo "tools\avatar\RIG_RHB_AVATAR_V2.py"

if (-not (Test-Path $Input)) { throw "INPUT_AVATAR_NOT_FOUND: $Input" }
if (-not (Test-Path $Py)) { throw "RIG_SCRIPT_NOT_FOUND: $Py" }

$BlenderCandidates = @(
  "$env:ProgramFiles\Blender Foundation\Blender 4.5\blender.exe",
  "$env:ProgramFiles\Blender Foundation\Blender 4.4\blender.exe",
  "$env:ProgramFiles\Blender Foundation\Blender 4.3\blender.exe"
)
$Blender = $BlenderCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $Blender) { throw "BLENDER_NOT_FOUND" }

Write-Host ""
Write-Host "=== RIGGING RHB AVATAR V2 ===" -ForegroundColor Cyan
Write-Host "Input:  $Input"
Write-Host "Output: $Output"
Write-Host ""

$Log = Join-Path $env:TEMP "rhb_avatar_v2_rig.log"
if (Test-Path $Log) { Remove-Item $Log -Force }

& $Blender --background --python $Py -- --input $Input --output $Output 2>&1 | Tee-Object -FilePath $Log
$exit=$LASTEXITCODE
if ($exit -ne 0) { throw "BLENDER_RIG_FAILED_$exit" }

if (-not (Select-String -Path $Log -Pattern "RHB_AVATAR_V2_RIGGED_OK=True" -Quiet)) {
  throw "RIG_SUCCESS_MARKER_NOT_FOUND. Review $Log"
}
if (-not (Test-Path $Output)) { throw "RIGGED_GLB_NOT_FOUND" }

Write-Host ""
Write-Host "RHB_AVATAR_V2_RIGGED_COMPLETE=True" -ForegroundColor Green
Write-Host "GLB=$Output" -ForegroundColor Green
