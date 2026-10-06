$ErrorActionPreference="Continue"
$Report=[ordered]@{checked_at=(Get-Date).ToString("s");computer=$env:COMPUTERNAME;checks=@()}
function Add-Check($Name,$Ok,$Detail){$Report.checks+= [ordered]@{name=$Name;ok=[bool]$Ok;detail=[string]$Detail};$mark=if($Ok){"[OK]"}else{"[--]"};Write-Host "$mark $Name - $Detail"}
function Test-Port($Name,$Port){try{$c=Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop|Select-Object -First 1;Add-Check $Name $true ("LISTEN 127.0.0.1:"+$Port)}catch{Add-Check $Name $false ("not listening :"+$Port)}}
Write-Host ""
Write-Host "RHB STUDIO - LOCAL APP READINESS"
Write-Host ""
Test-Port "OmniRoute" 20128
try{$h=Invoke-RestMethod "http://127.0.0.1:20128/api/monitoring/health" -TimeoutSec 4;Add-Check "OmniRoute health" ($h.status -eq "healthy") ($h|ConvertTo-Json -Compress)}catch{Add-Check "OmniRoute health" $false $_.Exception.Message}
Test-Port "OpenClaw" 18789
Test-Port "NEXO CORE" 20800
$roots=@(
 @{n="RHB STUDIO canonical root";p="$env:USERPROFILE\Desktop\STUDIO INGENIA CORE IA\100_RHB_STUDIO"},
 @{n="RHB STUDIO V6 runtime";p="$env:USERPROFILE\Desktop\STUDIO INGENIA CORE IA\100_RHB_STUDIO\RHB_STUDIO_V6"},
 @{n="XXXIA STUDIO CORE";p="$env:USERPROFILE\Desktop\XXXIA STUDIO CORE"},
 @{n="NEXO CORE V0.1";p="$env:USERPROFILE\Desktop\NEXO_CORE_V0_1"}
)
foreach($r in $roots){Add-Check $r.n (Test-Path $r.p) $r.p}
$v6=$roots[1].p
if(Test-Path $v6){
 $py=Get-Command python -ErrorAction SilentlyContinue
 if($py){& python -m compileall -q $v6;Add-Check "RHB V6 Python syntax" ($LASTEXITCODE -eq 0) ("compileall exit="+$LASTEXITCODE)}
 else{Add-Check "RHB V6 Python syntax" $false "python not found"}
}
try{$g=git --version 2>$null;Add-Check "Git" ($LASTEXITCODE -eq 0) $g}catch{Add-Check "Git" $false "git not found"}
try{$ssh=ssh -T git@github.com 2>&1;$ok=($ssh -match "successfully authenticated");Add-Check "GitHub SSH" $ok ($ssh -join " ")}catch{Add-Check "GitHub SSH" $false $_.Exception.Message}
$out=Join-Path $env:USERPROFILE "Desktop\RHB_LOCAL_APP_READINESS.json"
$Report|ConvertTo-Json -Depth 8|Set-Content $out -Encoding UTF8
Write-Host ""
Write-Host ("Report: "+$out)
Write-Host "No files or services were modified."
