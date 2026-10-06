param([switch]$IncludeDanmaps)
$ErrorActionPreference="Stop"
Write-Host "Installing GAZA geospatial agent skills..." -ForegroundColor Cyan
npx skills add jaakla/openmapstack-skills --skill open-map-stack --skill reproducible-gis-project --skill geospatial-data-discovery --skill spatial-sql -a codex -g -y
npx skills add CesiumGS/cesium-ai-integrations --skill cesium-context7 -a codex -g -y
if($IncludeDanmaps){ npx skills add danmaps/gis-agent-skills -a codex -g -y }
Write-Host "Done. Restart/reload Codex agent context before relying on newly installed skills." -ForegroundColor Green
