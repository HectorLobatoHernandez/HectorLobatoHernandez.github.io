param(
    [string]$InstallDir = "$env:USERPROFILE\Desktop\RHB_STUDIO_OPENDOTS",
    [string]$OmniRouteBaseUrl = "http://127.0.0.1:20128/v1",
    [string]$OmniRouteModel = "auto/best-coding",
    [string]$OmniRouteApiKey = "omniroute-local",
    [switch]$ConfigureIntelligence,
    [switch]$StartAfterInstall,
    [switch]$SeedAfterStart,
    [switch]$EnableComputers
)

$ErrorActionPreference = "Stop"

function Require-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' is not available."
    }
}

function Set-EnvValue([string]$Path, [string]$Name, [string]$Value) {
    $lines = @()
    if (Test-Path $Path) { $lines = Get-Content $Path }
    $escaped = [regex]::Escape($Name)
    $found = $false
    $out = foreach ($line in $lines) {
        if ($line -match "^$escaped=") {
            $found = $true
            "$Name=$Value"
        } else {
            $line
        }
    }
    if (-not $found) { $out += "$Name=$Value" }
    Set-Content -Path $Path -Value $out -Encoding UTF8
}

Write-Host "=== RHB STUDIO / OpenDots installer ==="

Require-Command git
Require-Command npm
Require-Command node

$nodeVersion = (& node -p "process.versions.node").Trim()
$major = [int]($nodeVersion.Split('.')[0])
if ($major -lt 24) {
    throw "OpenDots requires Node.js >= 24. Current version: $nodeVersion"
}
Write-Host "Node.js $nodeVersion OK"

$healthUrl = "http://127.0.0.1:20128/api/monitoring/health"
try {
    $health = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 5
    Write-Host "OmniRoute health: $($health.status)"
} catch {
    Write-Warning "OmniRoute is not reachable at $healthUrl. Installation can continue, but model calls will fail until OmniRoute is running."
}

if (-not (Test-Path $InstallDir)) {
    Write-Host "Cloning CopilotKit/OpenDots -> $InstallDir"
    git clone https://github.com/CopilotKit/OpenDots.git $InstallDir
} elseif (-not (Test-Path (Join-Path $InstallDir ".git"))) {
    throw "InstallDir exists but is not a Git repository: $InstallDir"
} else {
    Write-Host "Existing OpenDots checkout detected: $InstallDir"
    Push-Location $InstallDir
    try {
        $dirty = git status --porcelain
        if ([string]::IsNullOrWhiteSpace(($dirty -join ""))) {
            git fetch origin
            git pull --ff-only
        } else {
            Write-Warning "OpenDots checkout has local changes; upstream pull skipped."
        }
    } finally {
        Pop-Location
    }
}

Push-Location $InstallDir
try {
    Write-Host "Installing exact npm dependencies..."
    npm ci

    Write-Host "Applying RHB STUDIO OpenDots bridge..."
    $integrationRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
    $patchScript = Join-Path $integrationRoot "PATCH_RHB_OPENDOTS.ps1"
    $temporaryPatch = $null
    if (-not (Test-Path $patchScript)) {
        $temporaryPatch = Join-Path $env:TEMP "PATCH_RHB_OPENDOTS.ps1"
        Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/HectorLobatoHernandez/HectorLobatoHernandez.github.io/integration/opendots-rhb/integrations/opendots/PATCH_RHB_OPENDOTS.ps1" -OutFile $temporaryPatch
        $patchScript = $temporaryPatch
    }
    & $patchScript -InstallDir $InstallDir
    if ($temporaryPatch -and (Test-Path $temporaryPatch)) { Remove-Item $temporaryPatch -Force }

    Write-Host "Type-checking patched OpenDots..."
    npm run typecheck

    $envPath = Join-Path $InstallDir ".env"
    if (-not (Test-Path $envPath)) {
        Copy-Item ".env.example" $envPath
    }

    Set-EnvValue $envPath "HOST" "127.0.0.1"
    Set-EnvValue $envPath "PORT" "4310"
    Set-EnvValue $envPath "DATABASE_PATH" "data/rhb-studio-opendots.sqlite"
    Set-EnvValue $envPath "OWNER_ID" "rhb-studio-owner"
    Set-EnvValue $envPath "OPENAI_API_KEY" $OmniRouteApiKey
    Set-EnvValue $envPath "OPENAI_BASE_URL" $OmniRouteBaseUrl
    Set-EnvValue $envPath "OPENAI_MODEL" $OmniRouteModel
    Set-EnvValue $envPath "WEB_SEARCH_PROVIDER" "parallel"
    Set-EnvValue $envPath "COPILOTKIT_TELEMETRY_DISABLED" "true"
    Set-EnvValue $envPath "DO_NOT_TRACK" "1"
    Set-EnvValue $envPath "COMPUTER_SUPERVISOR_URL" "http://127.0.0.1:4312"
    Set-EnvValue $envPath "COMPUTER_NAMESPACE" "rhb-studio-opendots"

    Write-Host "Configured .env for OmniRoute: $OmniRouteBaseUrl"
    Write-Host "Model: $OmniRouteModel"

    if ($EnableComputers) {
        Write-Host "Enabling isolated per-Dot computers..."
        $integrationRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
        $computerScript = Join-Path $integrationRoot "ENABLE_RHB_DOT_COMPUTERS.ps1"
        $temporaryComputerScript = $null
        if (-not (Test-Path $computerScript)) {
            $temporaryComputerScript = Join-Path $env:TEMP "ENABLE_RHB_DOT_COMPUTERS.ps1"
            Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/HectorLobatoHernandez/HectorLobatoHernandez.github.io/integration/opendots-rhb/integrations/opendots/ENABLE_RHB_DOT_COMPUTERS.ps1" -OutFile $temporaryComputerScript
            $computerScript = $temporaryComputerScript
        }
        & $computerScript -InstallDir $InstallDir
        if ($temporaryComputerScript -and (Test-Path $temporaryComputerScript)) { Remove-Item $temporaryComputerScript -Force }
    }

    # Validate the OpenAI-compatible endpoint. A non-empty API key is required by OpenDots;
    # OmniRoute may ignore this value or require its own token.
    try {
        $headers = @{ Authorization = "Bearer $OmniRouteApiKey" }
        $body = @{
            model = $OmniRouteModel
            messages = @(@{ role = "user"; content = "Reply only with OK" })
            max_tokens = 8
        } | ConvertTo-Json -Depth 6
        $test = Invoke-RestMethod -Method Post -Uri ($OmniRouteBaseUrl.TrimEnd('/') + "/chat/completions") -Headers $headers -ContentType "application/json" -Body $body -TimeoutSec 30
        if ($test.choices) {
            Write-Host "OmniRoute chat-completions test: OK"
        } else {
            Write-Warning "OmniRoute returned a response without choices. Check model routing."
        }
    } catch {
        Write-Warning "OmniRoute chat-completions test failed: $($_.Exception.Message)"
        Write-Warning "If OmniRoute requires a specific token or model ID, rerun this installer with -OmniRouteApiKey and -OmniRouteModel."
    }

    if ($ConfigureIntelligence) {
        Write-Host "Starting CopilotKit login. Browser interaction is required."
        npx --yes copilotkit@latest login
        npx --yes copilotkit@latest project select
    } else {
        Write-Host ""
        Write-Host "CopilotKit Intelligence is still required for OpenDots conversations."
        Write-Host "Run later:"
        Write-Host "  cd `"$InstallDir`""
        Write-Host "  npx --yes copilotkit@latest login"
        Write-Host "  npx --yes copilotkit@latest project select"
    }

    if ($StartAfterInstall) {
        Write-Host "Starting OpenDots development runtime..."
        $cmd = "Set-Location -LiteralPath '$InstallDir'; npm run dev"
        Start-Process powershell -ArgumentList "-NoExit","-ExecutionPolicy","Bypass","-Command",$cmd

        $ready = $false
        for ($i=0; $i -lt 45; $i++) {
            Start-Sleep -Seconds 1
            try {
                Invoke-RestMethod -Uri "http://127.0.0.1:4310/api/workspace" -TimeoutSec 2 | Out-Null
                $ready = $true
                break
            } catch {}
        }

        if ($ready) {
            Write-Host "OpenDots API ready on http://127.0.0.1:4310"

            if ($SeedAfterStart) {
                Write-Host "Seeding RHB/GAZA Spaces and Dots..."
                $integrationRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
                $seedScript = Join-Path $integrationRoot "SEED_RHB_DOTS.ps1"
                $temporarySeed = $null
                if (-not (Test-Path $seedScript)) {
                    $temporarySeed = Join-Path $env:TEMP "SEED_RHB_DOTS.ps1"
                    Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/HectorLobatoHernandez/HectorLobatoHernandez.github.io/integration/opendots-rhb/integrations/opendots/SEED_RHB_DOTS.ps1" -OutFile $temporarySeed
                    $seedScript = $temporarySeed
                }
                & $seedScript
                if ($temporarySeed -and (Test-Path $temporarySeed)) { Remove-Item $temporarySeed -Force }
            }

            Start-Process "http://127.0.0.1:5173"
        } else {
            Write-Warning "OpenDots did not become ready within the startup probe window. Inspect the opened PowerShell window."
        }
    }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "OpenDots installation path: $InstallDir"
Write-Host "Integration complete. Use SEED_RHB_DOTS.ps1 after the API is running."
