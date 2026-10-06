param(
    [string]$InstallDir = "$env:USERPROFILE\Desktop\RHB_STUDIO_OPENDOTS"
)

$ErrorActionPreference = "Stop"

$sourceDir = Join-Path $InstallDir "src\server"
$dotAgent = Join-Path $sourceDir "dot-agent.ts"
if (-not (Test-Path $dotAgent)) {
    throw "OpenDots dot-agent.ts not found at $dotAgent"
}

$integrationRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$localToolSource = Join-Path $integrationRoot "rhb-tools.ts"
$targetToolSource = Join-Path $sourceDir "rhb-tools.ts"

if (Test-Path $localToolSource) {
    Copy-Item $localToolSource $targetToolSource -Force
} else {
    $raw = "https://raw.githubusercontent.com/HectorLobatoHernandez/HectorLobatoHernandez.github.io/integration/opendots-rhb/integrations/opendots/rhb-tools.ts"
    Invoke-WebRequest -UseBasicParsing -Uri $raw -OutFile $targetToolSource
}

$content = Get-Content $dotAgent -Raw

$importLine = "import { rhbSystemTools } from './rhb-tools.js';"
if ($content -notmatch [regex]::Escape($importLine)) {
    $marker = "import { computerTools } from './computer-tools.js';"
    if ($content -notmatch [regex]::Escape($marker)) {
        throw "Upstream dot-agent import marker changed; RHB patch not applied."
    }
    $content = $content.Replace($marker, "$marker`r`n$importLine")
}

$toolLine = "          ...rhbSystemTools(),"
if ($content -notmatch [regex]::Escape("...rhbSystemTools()")) {
    $marker = "        const serverTools = [`r`n          ...tools,"
    if ($content -notmatch [regex]::Escape($marker)) {
        $marker = "        const serverTools = [`n          ...tools,"
    }
    if ($content -notmatch [regex]::Escape($marker)) {
        throw "Upstream serverTools marker changed; RHB patch not applied."
    }
    $replacement = $marker + "`r`n" + $toolLine
    if ($marker.Contains("`n") -and -not $marker.Contains("`r`n")) {
        $replacement = $marker + "`n" + $toolLine
    }
    $content = $content.Replace($marker, $replacement)
}

Set-Content -Path $dotAgent -Value $content -Encoding UTF8
Write-Host "Applied RHB OpenDots patch: rhb_system_health tool enabled."
