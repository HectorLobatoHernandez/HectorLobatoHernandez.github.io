param(
  [Parameter(Mandatory=$true)]
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
  Write-Host "Only the render asset folder needs to be committed later:"
  Write-Host "  git add assets/visuals/sound-club-renders"
} finally {
  if ($work -and (Test-Path $work)) {
    Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
  }
}
