param(
    [string]$AvatarPath = "$env:USERPROFILE\Desktop\HectorLobatoHernandez.github.io\assets\models\avatar\hector-metaperson.glb"
)

$ErrorActionPreference = "Stop"

$Repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Py = Join-Path $PSScriptRoot "APPLY_REALISTIC_CURLY_HAIR.py"

if (-not (Test-Path $AvatarPath)) {
    throw "Avatar GLB not found: $AvatarPath"
}
if (-not (Test-Path $Py)) {
    throw "Blender script not found: $Py"
}

$candidates = @(
    "$env:ProgramFiles\Blender Foundation\Blender 4.5\blender.exe",
    "$env:ProgramFiles\Blender Foundation\Blender 4.4\blender.exe",
    "$env:ProgramFiles\Blender Foundation\Blender 4.3\blender.exe",
    "$env:ProgramFiles\Blender Foundation\Blender 4.2\blender.exe",
    "$env:ProgramFiles\Blender Foundation\Blender 4.1\blender.exe",
    "$env:ProgramFiles\Blender Foundation\Blender 4.0\blender.exe"
)

$Blender = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $Blender) {
    $Blender = Get-ChildItem "$env:ProgramFiles\Blender Foundation" -Recurse -Filter blender.exe -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending |
        Select-Object -First 1 -ExpandProperty FullName
}

if (-not $Blender) {
    throw "Blender executable not found."
}

Write-Host "Blender: $Blender" -ForegroundColor Cyan
Write-Host "Avatar:  $AvatarPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Applying realistic curly hair..." -ForegroundColor Yellow

& $Blender --background --python $Py -- --input $AvatarPath
if ($LASTEXITCODE -ne 0) {
    throw "Blender failed with exit code $LASTEXITCODE"
}

Write-Host ""
Write-Host "RHB_AVATAR_CURLY_HAIR_OK" -ForegroundColor Green
Write-Host "Updated: $AvatarPath" -ForegroundColor Green
Write-Host "Backup:  $([System.IO.Path]::ChangeExtension($AvatarPath,$null)).backup-before-curly.glb" -ForegroundColor DarkGray
