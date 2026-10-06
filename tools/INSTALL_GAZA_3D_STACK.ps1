param(
  [switch]$MintLogin,
  [switch]$SkipBlenderAddonDownload,
  [switch]$SkipPlaywright
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$GazaRoot = Join-Path $RepoRoot "apps\gaza"
$ToolRoot = Join-Path $env:LOCALAPPDATA "RHB_STUDIO\GAZA_3D"
New-Item -ItemType Directory -Force -Path $ToolRoot | Out-Null

function Have([string]$Name) {
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}
function Step([string]$Text) {
  Write-Host ""
  Write-Host "=== $Text ===" -ForegroundColor Cyan
}
function Run([string]$Exe, [string[]]$ArgumentList, [switch]$AllowFail) {
  Write-Host ("> " + $Exe + " " + ($ArgumentList -join " ")) -ForegroundColor DarkGray
  & $Exe @ArgumentList
  $code = $LASTEXITCODE
  if ($code -ne 0 -and -not $AllowFail) { throw "$Exe failed with exit code $code" }
  return $code
}
function VersionMajor([string]$Text) {
  $m = [regex]::Match($Text, '(\d+)')
  if (!$m.Success) { return 0 }
  return [int]$m.Groups[1].Value
}
function OpenClawHas([string]$Name) {
  if (!(Have "openclaw")) { return $false }
  & openclaw mcp show $Name --json *> $null
  return $LASTEXITCODE -eq 0
}
function CodexHas([string]$Name) {
  if (!(Have "codex")) { return $false }
  & codex mcp get $Name --json *> $null
  return $LASTEXITCODE -eq 0
}

function Refresh-Path {
  $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
}
function Have-Blender {
  if (Have "blender") { return $true }
  $roots = @(
    (Join-Path $env:ProgramFiles "Blender Foundation"),
    (Join-Path $env:LOCALAPPDATA "Programs\Blender Foundation")
  )
  foreach ($root in $roots) {
    if (Test-Path $root) {
      $exe = Get-ChildItem -Path $root -Filter "blender.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
      if ($exe) { return $true }
    }
  }
  return $false
}
function Winget-Install([string]$Id) {
  if (!(Have "winget")) { throw "winget is required to auto-install missing prerequisites: $Id" }
  Write-Host "[INSTALL] $Id" -ForegroundColor Yellow
  & winget install --id $Id --exact --accept-package-agreements --accept-source-agreements
  if ($LASTEXITCODE -ne 0) { throw "winget failed installing $Id (exit $LASTEXITCODE)" }
  Refresh-Path
}

Step "Automatic prerequisites"
if (!(Have "git")) { Winget-Install "Git.Git" }
if (!(Have "node")) { Winget-Install "OpenJS.NodeJS.LTS" }
if (!(Have "python")) { Winget-Install "Python.Python.3.12" }
if (!(Have-Blender)) {
  try { Winget-Install "BlenderFoundation.Blender.LTS.4.5" }
  catch { Write-Warning ("Blender winget install did not complete: " + $_.Exception.Message + ". Install Blender 4.2+ manually and rerun.") }
} else {
  Write-Host "[OK] Blender already installed"
}

Step "Prerequisites"
if (!(Have "git")) { throw "Git is required." }
if (!(Have "node")) { throw "Node.js is required. threejs-devtools-mcp currently targets Node 22." }
if (!(Have "npm") -or !(Have "npx")) { throw "npm/npx are required." }
$nodeVersion = (& node --version).Trim()
$nodeMajor = VersionMajor $nodeVersion
Write-Host "[OK] Node $nodeVersion"
if ($nodeMajor -lt 22) { throw "Node 22+ required for threejs-devtools-mcp. Current: $nodeVersion" }

if (!(Have "python")) { throw "Python 3.10+ is required for Blender MCP gateway." }
$pyVersion = (& python --version 2>&1 | Out-String).Trim()
$pyMatch = [regex]::Match($pyVersion, '(\d+)\.(\d+)')
if (!$pyMatch.Success -or [int]$pyMatch.Groups[1].Value -lt 3 -or ([int]$pyMatch.Groups[1].Value -eq 3 -and [int]$pyMatch.Groups[2].Value -lt 10)) {
  throw "Python 3.10+ required. Current: $pyVersion"
}
Write-Host "[OK] $pyVersion"

if (!(Have "openclaw")) { throw "OpenClaw CLI is required for the shared MCP registry." }
Write-Host ("[OK] " + ((& openclaw --version 2>&1 | Out-String).Trim()))

Step "Curated repository skills"
$skillsInstaller = Join-Path $PSScriptRoot "INSTALL_GAZA_SKILLS.ps1"
Write-Host ("> " + $skillsInstaller) -ForegroundColor DarkGray
& $skillsInstaller
if (-not $?) { throw "INSTALL_GAZA_SKILLS.ps1 failed." }

Step "Mint Three.js Skills"
Run "npx" @("--yes","skills","add","mintdotgg/mint-threejs-skills","-a","codex","-g","-y")

Step "Three.js DevTools MCP -> OpenClaw"
# Use mcp set so saving the definition never depends on a cold npx startup.
# The package can take longer than OpenClaw's 5 s default on first launch.
$threeConfig = '{"command":"npx","args":["-y","threejs-devtools-mcp"],"connectionTimeoutMs":30000,"requestTimeoutMs":60000}'
Run "openclaw" @("mcp","set","threejs-devtools",$threeConfig)
Run "openclaw" @("mcp","doctor","threejs-devtools","--probe") -AllowFail

Step "Blender MCP gateway"
Run "python" @("-m","pip","install","--upgrade","blender-mcp-ultra")
if (!(Have "blender-mcp-server")) {
  Write-Warning "blender-mcp-server is not on PATH yet. Open a new terminal after installation if Python Scripts was added to PATH."
} else {
  Write-Host "[OK] blender-mcp-server available"
  if (!(OpenClawHas "blender")) {
    Run "openclaw" @("mcp","add","blender","--command","blender-mcp-server")
  } else {
    Write-Host "[OK] blender MCP already configured"
  }
  Run "openclaw" @("mcp","doctor","blender","--probe") -AllowFail
}

Step "Blender addon package"
$addonZip = Join-Path $ToolRoot "blender_mcp_ultra.zip"
if (!$SkipBlenderAddonDownload) {
  try {
    $release = Invoke-RestMethod "https://api.github.com/repos/carlosh7/blender-mcp/releases/latest" -Headers @{"User-Agent"="RHB-STUDIO-GAZA-3D"}
    $asset = $release.assets | Where-Object { $_.name -eq "blender_mcp_ultra.zip" } | Select-Object -First 1
    if ($asset) {
      Invoke-WebRequest $asset.browser_download_url -OutFile $addonZip
      Write-Host "[OK] Blender addon downloaded: $addonZip"
    } else {
      Write-Warning "Latest release has no blender_mcp_ultra.zip asset. Use the repository INSTALL.md method."
    }
  } catch {
    Write-Warning ("Could not download Blender addon automatically: " + $_.Exception.Message)
  }
}
if (Test-Path $addonZip) {
  Write-Host "Blender GUI step: Edit > Preferences > Add-ons > Install from Disk... > $addonZip"
  Write-Host "Enable blender-mcp-ultra, open the N-panel MCP tab, and click Connect/Start Server."
}

Step "Mint MCP"
if (Have "codex") {
  if (!(CodexHas "mint")) { Run "codex" @("mcp","add","mint","--url","https://mcp.mint.gg/mcp") -AllowFail }
  else { Write-Host "[OK] Mint already configured in Codex" }
  if ($MintLogin) { Run "codex" @("mcp","login","mint") -AllowFail }
} else {
  Write-Warning "Codex CLI not found; Mint MCP was not added to Codex."
}
if (!(OpenClawHas "mint")) {
  Run "openclaw" @("mcp","add","mint","--url","https://mcp.mint.gg/mcp","--transport","streamable-http","--auth","oauth") -AllowFail
} else {
  Write-Host "[OK] Mint already configured in OpenClaw"
}
if ($MintLogin) { Run "openclaw" @("mcp","login","mint") -AllowFail }

if (!$SkipPlaywright) {
  Step "GAZA local visual QA harness"
  Push-Location $GazaRoot
  try {
    Run "npm" @("install")
    Run "npx" @("playwright","install","chromium")
  } finally {
    Pop-Location
  }
}

Step "Final registry checks"
Run "openclaw" @("mcp","status","--verbose") -AllowFail
Write-Host ""
Write-Host "GAZA 3D stack bootstrap finished." -ForegroundColor Green
Write-Host "Important: Blender MCP is not operational until the Blender addon is enabled and its local server is started."
Write-Host "Mint may require OAuth/account authorization; run this script again with -MintLogin when desired."
Write-Host "Next local command: powershell -ExecutionPolicy Bypass -File .\tools\VERIFY_GAZA_3D_STACK.ps1"
