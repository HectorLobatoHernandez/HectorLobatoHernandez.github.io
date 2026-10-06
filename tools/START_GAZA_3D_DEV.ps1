$ErrorActionPreference="Stop"
$RepoRoot=Split-Path -Parent $PSScriptRoot
$GazaRoot=Join-Path $RepoRoot "apps\gaza"
if(!(Test-Path (Join-Path $GazaRoot "node_modules"))){
  Push-Location $GazaRoot
  try{ npm install; if($LASTEXITCODE -ne 0){throw "npm install failed"} }
  finally{ Pop-Location }
}
$cmd="Set-Location '$GazaRoot'; npm run dev"
Start-Process powershell -ArgumentList @("-NoExit","-NoProfile","-ExecutionPolicy","Bypass","-Command",$cmd)
Start-Sleep -Seconds 2
Start-Process "http://127.0.0.1:4173/game.html"
Write-Host "GAZA local dev: http://127.0.0.1:4173/game.html"
Write-Host "Plant 3D:       http://127.0.0.1:4173/plant-3d.html"
Write-Host "Territory:      http://127.0.0.1:4173/territory.html"
Write-Host ""
Write-Host "Three.js MCP check:"
openclaw mcp doctor threejs-devtools --probe
