$ErrorActionPreference = "Continue"
$checks = @()

function Add-Check($name,$ok,$detail) {
  $script:checks += [ordered]@{name=$name;ok=[bool]$ok;detail=[string]$detail}
  $mark = if($ok){"[OK]"}else{"[--]"}
  Write-Host "$mark $name - $detail"
}
function Have($name){ return $null -ne (Get-Command $name -ErrorAction SilentlyContinue) }
function Probe-Mcp($name) {
  if(!(Have "openclaw")) { Add-Check "MCP $name" $false "openclaw missing"; return }
  $out = & openclaw mcp doctor $name --probe 2>&1 | Out-String
  Add-Check "MCP $name" ($LASTEXITCODE -eq 0) $out.Trim()
}

Write-Host ""
Write-Host "GAZA 3D STACK - VERIFICATION"
Write-Host ""

if(Have "node"){
  $v=(& node --version).Trim();$major=[int](([regex]::Match($v,'\d+')).Value)
  Add-Check "Node 22+" ($major -ge 22) $v
}else{Add-Check "Node 22+" $false "node not found"}

if(Have "python"){
  $v=(& python --version 2>&1|Out-String).Trim()
  $m=[regex]::Match($v,'(\d+)\.(\d+)')
  $ok=$m.Success -and ([int]$m.Groups[1].Value -gt 3 -or ([int]$m.Groups[1].Value -eq 3 -and [int]$m.Groups[2].Value -ge 10))
  Add-Check "Python 3.10+" $ok $v
}else{Add-Check "Python 3.10+" $false "python not found"}

Add-Check "OpenClaw" (Have "openclaw") ($(if(Have "openclaw"){(& openclaw --version 2>&1|Out-String).Trim()}else{"not found"}))
Add-Check "Codex" (Have "codex") ($(if(Have "codex"){(& codex --version 2>&1|Out-String).Trim()}else{"not found"}))
$gateway = Get-Command "blender-mcp-server" -ErrorAction SilentlyContinue
$gatewayPath = if($gateway){$gateway.Source}else{$null}
if(!$gatewayPath -and (Have "python")){
  $scripts=(& python -c "import sysconfig; print(sysconfig.get_path('scripts'))" 2>$null|Out-String).Trim()
  if($scripts){
    $candidate=Join-Path $scripts "blender-mcp-server.exe"
    if(Test-Path $candidate){$gatewayPath=$candidate}
  }
}
Add-Check "Blender gateway command" ([bool]$gatewayPath) ($(if($gatewayPath){$gatewayPath}else{"not found on PATH or Python Scripts"}))

$blender = Get-Command blender -ErrorAction SilentlyContinue
$blenderPath = if($blender){$blender.Source}else{$null}
if(!$blenderPath){
  $roots=@((Join-Path $env:ProgramFiles "Blender Foundation"),(Join-Path $env:LOCALAPPDATA "Programs\Blender Foundation"))
  foreach($root in $roots){
    if(Test-Path $root){
      $candidate=Get-ChildItem -Path $root -Filter "blender.exe" -Recurse -ErrorAction SilentlyContinue|Select-Object -First 1
      if($candidate){$blenderPath=$candidate.FullName;break}
    }
  }
}
if($blenderPath){
  $v=(& $blenderPath --version 2>&1|Select-Object -First 1|Out-String).Trim()
  $m=[regex]::Match($v,'(\d+)\.(\d+)')
  $ok=$m.Success -and ([int]$m.Groups[1].Value -gt 4 -or ([int]$m.Groups[1].Value -eq 4 -and [int]$m.Groups[2].Value -ge 2))
  Add-Check "Blender 4.2+" $ok "$v | $blenderPath"
}else{Add-Check "Blender 4.2+" $false "blender executable not found"}

try{
  $tcp=Test-NetConnection 127.0.0.1 -Port 9876 -WarningAction SilentlyContinue
  Add-Check "Blender addon socket :9876" $tcp.TcpTestSucceeded ($(if($tcp.TcpTestSucceeded){"LISTEN"}else{"not listening - enable addon and click Connect/Start Server"}))
}catch{Add-Check "Blender addon socket :9876" $false $_.Exception.Message}

Probe-Mcp "threejs-devtools"
Probe-Mcp "blender"

if(Have "openclaw"){
  & openclaw mcp show mint --json *> $null
  Add-Check "Mint MCP configured in OpenClaw" ($LASTEXITCODE -eq 0) "OAuth may still require login"
}
if(Have "codex"){
  & codex mcp get mint --json *> $null
  Add-Check "Mint MCP configured in Codex" ($LASTEXITCODE -eq 0) "OAuth may still require login"
}

$gaza=Join-Path (Split-Path -Parent $PSScriptRoot) "apps\gaza"
Add-Check "GAZA package.json" (Test-Path (Join-Path $gaza "package.json")) $gaza
Add-Check "GAZA node_modules" (Test-Path (Join-Path $gaza "node_modules")) "npm install"
Add-Check "Playwright Chromium cache" (Test-Path (Join-Path $env:LOCALAPPDATA "ms-playwright")) (Join-Path $env:LOCALAPPDATA "ms-playwright")

$report=[ordered]@{checked_at=(Get-Date).ToString("o");checks=$checks}
$out=Join-Path $env:USERPROFILE "Desktop\GAZA_3D_STACK_VERIFY.json"
$report|ConvertTo-Json -Depth 8|Set-Content $out -Encoding UTF8
Write-Host ""
Write-Host "Report: $out"
if(($checks|Where-Object{-not $_.ok}).Count -gt 0){exit 2}else{exit 0}
