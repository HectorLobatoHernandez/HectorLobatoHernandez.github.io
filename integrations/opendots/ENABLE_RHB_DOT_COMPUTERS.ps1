param(
    [string]$InstallDir = "$env:USERPROFILE\Desktop\RHB_STUDIO_OPENDOTS"
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
        } else { $line }
    }
    if (-not $found) { $out += "$Name=$Value" }
    Set-Content -Path $Path -Value $out -Encoding UTF8
}

function Get-EnvValue([string]$Path, [string]$Name) {
    if (-not (Test-Path $Path)) { return "" }
    $line = Get-Content $Path | Where-Object { $_ -match ("^" + [regex]::Escape($Name) + "=") } | Select-Object -First 1
    if (-not $line) { return "" }
    return $line.Substring($Name.Length + 1)
}

function New-HexSecret([int]$Bytes = 32) {
    $buffer = New-Object byte[] $Bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($buffer)
    return ([System.BitConverter]::ToString($buffer)).Replace("-","").ToLowerInvariant()
}

Require-Command docker

if (-not (Test-Path (Join-Path $InstallDir "compose.computers.yml"))) {
    throw "OpenDots computer compose file not found at $InstallDir"
}

try {
    docker version | Out-Null
} catch {
    throw "Docker is installed but the Docker engine is not available. Start Docker Desktop and retry."
}

$envPath = Join-Path $InstallDir ".env"
if (-not (Test-Path $envPath)) {
    throw ".env not found. Run INSTALL_RHB_OPENDOTS.ps1 first."
}

$supervisorToken = Get-EnvValue $envPath "COMPUTER_SUPERVISOR_TOKEN"
$computerToken = Get-EnvValue $envPath "COMPUTER_TOKEN"

if ([string]::IsNullOrWhiteSpace($supervisorToken)) { $supervisorToken = New-HexSecret }
if ([string]::IsNullOrWhiteSpace($computerToken)) { $computerToken = New-HexSecret }

Set-EnvValue $envPath "COMPUTER_SUPERVISOR_URL" "http://127.0.0.1:4312"
Set-EnvValue $envPath "COMPUTER_SUPERVISOR_TOKEN" $supervisorToken
Set-EnvValue $envPath "COMPUTER_TOKEN" $computerToken
Set-EnvValue $envPath "COMPUTER_NAMESPACE" "rhb-studio-opendots"

Push-Location $InstallDir
try {
    Write-Host "Building OpenDots/OpenBot computer services..."
    docker compose -f compose.computers.yml build computer-image computer-supervisor

    Write-Host "Starting computer supervisor..."
    docker compose -f compose.computers.yml up -d computer-supervisor

    $ready = $false
    for ($i=0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        if (Test-NetConnection -ComputerName 127.0.0.1 -Port 4312 -InformationLevel Quiet -WarningAction SilentlyContinue) {
            $ready = $true
            break
        }
    }

    if (-not $ready) {
        throw "Computer supervisor did not become reachable on 127.0.0.1:4312."
    }

    Write-Host "OpenDots computer supervisor RUNNING :4312"
    Write-Host "Secrets were written only to the local OpenDots .env."
    Write-Host "Restart OpenDots after enabling computers so it reloads the new environment."
} finally {
    Pop-Location
}
