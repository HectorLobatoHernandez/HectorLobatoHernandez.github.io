$ErrorActionPreference="Stop"
$root=Split-Path -Parent $PSScriptRoot
$service=Join-Path $root "services\gaza-integration-gateway\server.mjs"
if(-not (Get-Command node -ErrorAction SilentlyContinue)){throw "Node.js 22+ required."}
$major=[int]((node -p "process.versions.node.split('.')[0]") -as [string])
if($major -lt 22){throw "Node.js 22+ required. Found $(node -v)."}
Write-Host "Starting GAZA Integration Gateway · READ_ONLY_DISCOVERY" -ForegroundColor Cyan
Write-Host "http://127.0.0.1:20840/health" -ForegroundColor DarkGray
node $service
