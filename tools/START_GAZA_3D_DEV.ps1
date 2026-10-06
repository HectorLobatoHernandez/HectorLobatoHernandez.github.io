$ErrorActionPreference="Stop"
$RepoRoot=Split-Path -Parent $PSScriptRoot
$GazaRoot=Join-Path $RepoRoot "apps\gaza"
$BaseUrl="http://127.0.0.1:4173"
$GameUrl="$BaseUrl/game.html"

if(!(Test-Path (Join-Path $GazaRoot "node_modules"))){
  Push-Location $GazaRoot
  try{
    npm install
    if($LASTEXITCODE -ne 0){throw "npm install failed"}
  }
  finally{ Pop-Location }
}

# If the dev server is already alive, reuse it. Otherwise launch it in a
# persistent PowerShell window and wait for a real HTTP response.
$serverReady=$false
try{
  $response=Invoke-WebRequest -Uri $GameUrl -UseBasicParsing -TimeoutSec 2
  $serverReady=($response.StatusCode -ge 200 -and $response.StatusCode -lt 500)
}catch{}

if(!$serverReady){
  $cmd="Set-Location '$GazaRoot'; npm run dev"
  $serverProcess=Start-Process powershell -ArgumentList @(
    "-NoExit","-NoProfile","-ExecutionPolicy","Bypass","-Command",$cmd
  ) -PassThru

  Write-Host "Starting GAZA dev server on $BaseUrl ..."
  for($i=0;$i -lt 30;$i++){
    Start-Sleep -Milliseconds 500
    if($serverProcess.HasExited){
      throw "GAZA dev server process exited before port 4173 became ready."
    }
    try{
      $response=Invoke-WebRequest -Uri $GameUrl -UseBasicParsing -TimeoutSec 1
      if($response.StatusCode -ge 200 -and $response.StatusCode -lt 500){
        $serverReady=$true
        break
      }
    }catch{}
  }
}

if(!$serverReady){
  throw "GAZA dev server did not become ready at $GameUrl within 15 seconds."
}

Write-Host "[OK] GAZA dev server ready" -ForegroundColor Green
Write-Host "Strategy Twin:  $GameUrl"
Write-Host "Plant 3D:       $BaseUrl/plant-3d.html"
Write-Host "Territory:      $BaseUrl/territory.html"
Write-Host ""
Write-Host "Opening Strategy Twin in the default browser..."

# Do not run an MCP doctor/probe here. Browser-driving MCP probes may launch
# and close their own Chrome instance; MCP health belongs in VERIFY_GAZA_3D_STACK.ps1.
Start-Process $GameUrl
