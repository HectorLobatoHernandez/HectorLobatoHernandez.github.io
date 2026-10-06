param(
  [string]$CodexSkillsRoot = "$HOME\.codex\skills",
  [string]$OpenClawSkillsRoot = ""
)
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$Sources = @(
  "skills\gaza-strategy-digital-twin",
  "skills\vendor\anthropic\frontend-design",
  "skills\vendor\mengto\video-to-superprompt",
  "skills\vendor\davila\3d-web-experience",
  "skills\vendor\threejs\threejs-core",
  "skills\vendor\threejs\threejs-camera",
  "skills\vendor\threejs\threejs-animation",
  "skills\vendor\threejs\threejs-geometry",
  "skills\vendor\threejs\threejs-lighting",
  "skills\vendor\threejs\threejs-materials",
  "skills\vendor\threejs\threejs-performance",
  "skills\vendor\openai\playwright-interactive"
)
function Install-SkillSet([string]$TargetRoot) {
  if ([string]::IsNullOrWhiteSpace($TargetRoot)) { return }
  New-Item -ItemType Directory -Force -Path $TargetRoot | Out-Null
  foreach ($rel in $Sources) {
    $src = Join-Path $RepoRoot $rel
    if (!(Test-Path $src)) { throw "Missing skill source: $src" }
    $name = Split-Path $src -Leaf
    $dst = Join-Path $TargetRoot $name
    if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
    Copy-Item -Recurse -Force $src $dst
    Write-Host "[OK] $name -> $dst"
  }
}
Write-Host "Installing curated GAZA skills..."
Install-SkillSet $CodexSkillsRoot
if ($OpenClawSkillsRoot) { Install-SkillSet $OpenClawSkillsRoot }
Write-Host ""
Write-Host "Skills copied. No agent security settings were changed."
Write-Host "Playwright Interactive has extra local prerequisites; read its SKILL.md before enabling them."
