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
function Run([string]$Exe, [string[]]$Args, [switch]$AllowFail) {
  Write-Host ("> " + $Exe + " " + ($Args -join " ")) -ForegroundColor DarkGray
  & $Exe @Args
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
Run "powershell" @("-NoProfile","-ExecutionPolicy","Bypass","-File",(Join-Path $PSScriptRoot "INSTALL_GAZA_SKILLS.ps1"))

Step "Mint Three.js Skills"
Run "npx" @("--yes","skills","add","mintdotgg/mint-threejs-skills","-a","codex","-g","-y")

Step "Three.js DevTools MCP -> OpenClaw"
if (!(OpenClawHas "threejs-devtools")) {
  Run "openclaw" @("mcp","add","threejs-devtools","--command","npx","--arg","-y","--arg","threejs-devtools-mcp")
} else {
  Write-Host "[OK] threejs-devtools already configured"
}
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
