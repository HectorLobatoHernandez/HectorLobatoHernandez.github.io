$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Windows.Forms

$Repo = "$env:USERPROFILE\Desktop\HectorLobatoHernandez.github.io"
$Generator = Join-Path $Repo "tools\avatar\GENERATE_RHB_AVATAR.ps1"
$Output = Join-Path $Repo "assets\models\avatar\hector-avatar-v2.glb"

$names = @(
  "Avatar urbano caminando en realidad virtual(2).png",
  "Avatar urbano caminando en realidad virtual(1).png",
  "avatar-master-reference.jpg"
)

$roots = @(
  "$env:USERPROFILE\Downloads",
  "$env:USERPROFILE\Desktop",
  "$env:USERPROFILE\Pictures",
  "$env:USERPROFILE\Documents"
)

$Image = $null
foreach ($root in $roots) {
  if (-not (Test-Path $root)) { continue }
  foreach ($name in $names) {
    $hit = Get-ChildItem $root -Recurse -File -Filter $name -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($hit) { $Image = $hit.FullName; break }
  }
  if ($Image) { break }
}

if (-not $Image) {
  $dlg = New-Object System.Windows.Forms.OpenFileDialog
  $dlg.Title = "Selecciona la imagen maestra del avatar"
  $dlg.Filter = "Imagenes|*.png;*.jpg;*.jpeg;*.webp"
  $dlg.InitialDirectory = "$env:USERPROFILE\Downloads"
  $dlg.Multiselect = $false
  if ($dlg.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
    throw "AVATAR_REFERENCE_NOT_SELECTED"
  }
  $Image = $dlg.FileName
  $dlg.Dispose()
}

Write-Host ""
Write-Host "REFERENCE=$Image" -ForegroundColor Cyan
Write-Host "OUTPUT=$Output" -ForegroundColor Cyan
Write-Host ""

& $Generator -Image $Image -Output $Output -ChunkSize 1024 -Resolution 192
if ($LASTEXITCODE -ne 0) { throw "RHB_AVATAR_GENERATOR_FAILED_$LASTEXITCODE" }

if (-not (Test-Path $Output)) { throw "RHB_AVATAR_GLB_NOT_CREATED" }

Write-Host ""
Write-Host "RHB_AVATAR_V2_COMPLETE=True" -ForegroundColor Green
Write-Host "GLB=$Output" -ForegroundColor Green