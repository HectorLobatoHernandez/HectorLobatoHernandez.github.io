param(
  [string]$Source
)

$ErrorActionPreference = "Stop"

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$dest = Join-Path $repo "assets\visuals\sound-club-renders"
$expected = @(
  "overall-massing.webp",
  "overall-plan.webp",
  "overall-interior-final.webp",
  "overall-exterior-final.webp",
  "dj-structure-side.webp",
  "dj-structure-back.webp",
  "dj-final-detail.webp",
  "dj-final-overview.webp",
  "lighting-ceiling.webp",
  "lighting-final.webp",
  "glass-closed.webp",
  "glass-open.webp",
  "lounge-final.webp",
  "exterior-planting-detail.webp",
  "exterior-glass-final.webp"
)

if (-not $Source) {
  $searchRoots = @(
    (Join-Path $env:USERPROFILE "Downloads"),
    (Join-Path $env:USERPROFILE "Desktop"),
    (Join-Path $env:USERPROFILE "Documents")
  ) | Where-Object { Test-Path $_ }

  $matches = foreach ($root in $searchRoots) {
    Get-ChildItem -LiteralPath $root -File -Filter "SOUND_CLUB_RENDER_MOLDS_V1*.zip" -ErrorAction SilentlyContinue
  }

  $match = $matches |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if ($match) {
    $Source = $match.FullName
    Write-Host "Auto-detected render pack: $Source" -ForegroundColor Cyan
  }
}

if (-not $Source) {
  throw "Render pack not found. Download SOUND_CLUB_RENDER_MOLDS_V1.zip first, then rerun this script. It searches Downloads, Desktop and Documents automatically."
}

if (-not (Test-Path -LiteralPath $Source)) {
  throw "Source not found: $Source"
}

$work = $null
try {
  if ([IO.Path]::GetExtension($Source) -ieq ".zip") {
    $work = Join-Path $env:TEMP ("sound-club-render-molds-" + [guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Force -Path $work | Out-Null
    Expand-Archive -LiteralPath $Source -DestinationPath $work -Force

    $candidate = Join-Path $work "assets\visuals\sound-club-renders"
    if (Test-Path $candidate) {
      $sourceDir = $candidate
    } else {
      $sourceDir = $work
    }
  } else {
    $sourceDir = (Resolve-Path -LiteralPath $Source).Path
  }

  New-Item -ItemType Directory -Force -Path $dest | Out-Null

  $missing = @()
  foreach ($name in $expected) {
    $src = Join-Path $sourceDir $name
    if (-not (Test-Path $src)) {
      $missing += $name
      continue
    }
    Copy-Item -LiteralPath $src -Destination (Join-Path $dest $name) -Force
  }

  if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "Missing files:" -ForegroundColor Yellow
    $missing | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
    throw "Render mold package is incomplete."
  }

  Write-Host ""
  Write-Host "=== SOUND CLUB · RENDER MOLDS INSTALLED ===" -ForegroundColor Green
  Write-Host "Destination: $dest"
  Write-Host ""

  Get-ChildItem -LiteralPath $dest -Filter *.webp |
    Sort-Object Name |
    Select-Object Name, Length |
    Format-Table -AutoSize

  Write-Host ""
  Write-Host "Next local check:" -ForegroundColor Cyan
  Write-Host "  http://localhost:8000/projects/sound-club-palma.html?candidate=v3"
  Write-Host ""
  Write-Host "Installed render assets are now ready for local review."
  Write-Host "Do not commit yet until the carousels have been visually checked."
} finally {
  if ($work -and (Test-Path $work)) {
    Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
  }
}
