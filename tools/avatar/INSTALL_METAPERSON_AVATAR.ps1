param(
  [string]$Source = ""
)

$ErrorActionPreference = "Stop"
$repo = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$destDir = Join-Path $repo "assets\models\avatar"
$dest = Join-Path $destDir "hector-metaperson.glb"

function Find-AvatarZip {
  param([string]$Explicit)

  if ($Explicit) {
    if (Test-Path $Explicit) { return (Resolve-Path $Explicit).Path }
    throw "SOURCE_NOT_FOUND: $Explicit"
  }

  $roots = @(
    "$env:USERPROFILE\Downloads",
    "$env:USERPROFILE\Desktop",
    "$env:USERPROFILE\Documents"
  ) | Where-Object { Test-Path $_ }

  $matches = foreach ($root in $roots) {
    Get-ChildItem -Path $root -File -Filter "avatar*.zip" -ErrorAction SilentlyContinue
  }

  $latest = $matches | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $latest) {
    throw "AVATAR_ZIP_NOT_FOUND. Pass -Source with the full path to avatar.zip."
  }

  return $latest.FullName
}

$zip = Find-AvatarZip -Explicit $Source
Write-Host "Avatar package: $zip" -ForegroundColor Cyan

$tmp = Join-Path $env:TEMP ("hl-avatar-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null

try {
  Expand-Archive -Path $zip -DestinationPath $tmp -Force

  $model = Get-ChildItem -Path $tmp -Recurse -File -Filter "model.glb" |
    Sort-Object Length -Descending |
    Select-Object -First 1

  if (-not $model) {
    throw "MODEL_GLB_NOT_FOUND_INSIDE_ZIP"
  }

  New-Item -ItemType Directory -Path $destDir -Force | Out-Null
  Copy-Item $model.FullName $dest -Force

  $size = (Get-Item $dest).Length
  $hash = (Get-FileHash $dest -Algorithm SHA256).Hash.ToLowerInvariant()

  Write-Host ""
  Write-Host "INSTALLED" -ForegroundColor Green
  Write-Host "  File: $dest"
  Write-Host ("  Size: {0:N2} MiB" -f ($size / 1MB))
  Write-Host "  SHA256: $hash"
  Write-Host ""
  Write-Host "Open:" -ForegroundColor Yellow
  Write-Host "  http://localhost:8000/experience/"
  Write-Host ""
  Write-Host "MetaPerson GLB is now the primary avatar. The old procedural avatar remains only as fallback."
}
finally {
  Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
}
