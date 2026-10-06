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
  $oldPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "SilentlyContinue"
    & openclaw mcp show $Name --json 1>$null 2>$null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  } finally {
    $ErrorActionPreference = $oldPreference
  }
}
function CodexHas([string]$Name) {
  if (!(Have "codex")) { return $false }
  $oldPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "SilentlyContinue"
    & codex mcp get $Name --json 1>$null 2>$null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  } finally {
    $ErrorActionPreference = $oldPreference
  }
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
# OpenClaw mcp add probes before saving by default. On a cold npx launch that can
# exceed the default 5 s timeout, so save first with --no-probe, configure longer
# timeouts, then probe explicitly.
# Avoid inline JSON here: Windows PowerShell 5.1 legacy native-argument passing
# can strip the quotes before the Node/OpenClaw CLI receives the JSON.
if (!(OpenClawHas "threejs-devtools")) {
  Run "openclaw" @("mcp","add","threejs-devtools","--command","npx","--arg","-y","--arg","threejs-devtools-mcp","--no-probe")
}
if (OpenClawHas "threejs-devtools") {
  Run "openclaw" @("mcp","configure","threejs-devtools","--connect-timeout","30","--timeout","60")
  Run "openclaw" @("mcp","doctor","threejs-devtools","--probe") -AllowFail
} else {
  throw "threejs-devtools definition was not saved by OpenClaw."
}

Step "Blender MCP gateway"
Run "python" @("-m","pip","install","--upgrade","blender-mcp-ultra")
$blenderMcpCommand = $null
$blenderMcpResolved = Get-Command "blender-mcp-server" -ErrorAction SilentlyContinue
if ($blenderMcpResolved) {
  $blenderMcpCommand = $blenderMcpResolved.Source
} else {
  $pythonScripts = (& python -c "import sysconfig; print(sysconfig.get_path('scripts'))" 2>$null | Out-String).Trim()
  if ($pythonScripts) {
    $candidate = Join-Path $pythonScripts "blender-mcp-server.exe"
    if (Test-Path $candidate) { $blenderMcpCommand = $candidate }
  }
}
if (!$blenderMcpCommand) {
  Write-Warning "blender-mcp-server was installed but its executable could not be resolved. Rerun VERIFY_GAZA_3D_STACK.ps1 after opening a new terminal."
} else {
  Write-Host "[OK] blender-mcp-server available: $blenderMcpCommand"
  if (!(OpenClawHas "blender")) {
    Run "openclaw" @("mcp","add","blender","--command",$blenderMcpCommand,"--no-probe")
  }
  if (OpenClawHas "blender") {
    Run "openclaw" @("mcp","configure","blender","--connect-timeout","30","--timeout","60")
    # Blender-side tools become live after the addon connects on localhost:9876.
    Run "openclaw" @("mcp","doctor","blender","--probe") -AllowFail
  } else {
    Write-Warning "Blender MCP definition was not saved by OpenClaw; verifier will report it."
  }
}

Step "Blender addon package"
$addonZip = Join-Path $ToolRoot "blender_mcp_ultra.zip"
if (!$SkipBlenderAddonDownload) {
  $addonReady = $false
  try {
    $release = Invoke-RestMethod "https://api.github.com/repos/carlosh7/blender-mcp/releases/latest" -Headers @{"User-Agent"="RHB-STUDIO-GAZA-3D"}
    $asset = $release.assets | Where-Object { $_.name -eq "blender_mcp_ultra.zip" } | Select-Object -First 1
    if ($asset) {
      Invoke-WebRequest $asset.browser_download_url -OutFile $addonZip
      $addonReady = Test-Path $addonZip
      if ($addonReady) { Write-Host "[OK] Blender addon downloaded: $addonZip" }
    }
  } catch {
    Write-Warning ("Release addon download unavailable: " + $_.Exception.Message)
  }

  if (!$addonReady) {
    Write-Host "[INFO] Release has no addon ZIP; building it from the official addon/ source."
    $sourceRoot = Join-Path $ToolRoot "blender-mcp-source"
    $stageRoot = Join-Path $ToolRoot "blender-addon-stage"
    Remove-Item $sourceRoot -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $stageRoot -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $addonZip -Force -ErrorAction SilentlyContinue
    Run "git" @("clone","--depth","1","https://github.com/carlosh7/blender-mcp.git",$sourceRoot)
    $addonSource = Join-Path $sourceRoot "addon"
    if (!(Test-Path $addonSource)) { throw "Official Blender MCP repository has no addon/ directory." }
    $addonStage = Join-Path $stageRoot "blender_mcp_ultra"
    New-Item -ItemType Directory -Force -Path $addonStage | Out-Null
    Copy-Item (Join-Path $addonSource "*") $addonStage -Recurse -Force
    Compress-Archive -Path $addonStage -DestinationPath $addonZip -Force
    $addonReady = Test-Path $addonZip
    if (!$addonReady) { throw "Failed to build Blender addon ZIP." }
    Write-Host "[OK] Blender addon built from official source: $addonZip"
  }
}
if (Test-Path $addonZip) {
  Write-Host "Blender GUI step: Edit > Preferences > Add-ons/Get Extensions > Install from Disk... > $addonZip"
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
  Run "openclaw" @("mcp","add","mint","--url","https://mcp.mint.gg/mcp","--transport","streamable-http","--auth","oauth","--no-probe") -AllowFail
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
