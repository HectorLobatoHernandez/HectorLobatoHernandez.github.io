$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== RHB AVATAR FREE 3D PIPELINE ===" -ForegroundColor Cyan
Write-Host "Installing ComfyUI-3D-Pack + TripoSR locally" -ForegroundColor Cyan
Write-Host ""

$home = $env:USERPROFILE
$candidates = @(
    "$home\ComfyUI",
    "$home\Desktop\ComfyUI",
    "$home\Documents\ComfyUI",
    "$home\Downloads\ComfyUI",
    "$home\Pinokio\api\comfyui.git\app",
    "$home\pinokio\api\comfyui.git\app",
    "$home\Desktop\ComfyUI_windows_portable\ComfyUI",
    "$home\Downloads\ComfyUI_windows_portable\ComfyUI"
)

$comfy = $null
foreach ($p in $candidates) {
    if (Test-Path (Join-Path $p "main.py")) {
        $comfy = $p
        break
    }
}

if (-not $comfy) {
    Write-Host "ComfyUI not found in common locations. Searching user profile..." -ForegroundColor Yellow
    $hit = Get-ChildItem $home -Directory -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -eq "ComfyUI" -and (Test-Path (Join-Path $_.FullName "main.py")) } |
        Select-Object -First 1
    if ($hit) { $comfy = $hit.FullName }
}

if (-not $comfy) {
    throw "COMFYUI_NOT_FOUND"
}

Write-Host "[OK] ComfyUI: $comfy" -ForegroundColor Green

$customNodes = Join-Path $comfy "custom_nodes"
New-Item -ItemType Directory -Force -Path $customNodes | Out-Null

$pack = Join-Path $customNodes "ComfyUI-3D-Pack"

if (-not (Test-Path $pack)) {
    Write-Host "Cloning ComfyUI-3D-Pack..." -ForegroundColor Yellow
    git clone https://github.com/MrForExample/ComfyUI-3D-Pack.git $pack
} else {
    Write-Host "Updating ComfyUI-3D-Pack..." -ForegroundColor Yellow
    git -C $pack pull
}

$pythonCandidates = @(
    (Join-Path (Split-Path $comfy -Parent) "python_embeded\python.exe"),
    (Join-Path $comfy "python_embeded\python.exe"),
    (Join-Path $comfy ".venv\Scripts\python.exe"),
    (Join-Path (Split-Path $comfy -Parent) ".venv\Scripts\python.exe")
)

$python = $pythonCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $python) {
    $cmd = Get-Command python -ErrorAction SilentlyContinue
    if ($cmd) { $python = $cmd.Source }
}

if (-not $python) {
    throw "PYTHON_NOT_FOUND_FOR_COMFYUI"
}

Write-Host "[OK] Python: $python" -ForegroundColor Green

Write-Host ""
Write-Host "Running ComfyUI-3D-Pack installer..." -ForegroundColor Yellow
Push-Location $pack
try {
    & $python install.py
    if ($LASTEXITCODE -ne 0) {
        throw "COMFY3D_INSTALL_FAILED_$LASTEXITCODE"
    }
}
finally {
    Pop-Location
}

# Low-VRAM defaults for GTX 1660 SUPER 6 GB.
$configDir = Join-Path $pack "configs"
if (Test-Path $configDir) {
    Write-Host "[OK] 3D Pack config directory detected." -ForegroundColor Green
}

$inputDir = Join-Path $comfy "input"
$outputDir = Join-Path $comfy "output"
New-Item -ItemType Directory -Force -Path $inputDir | Out-Null
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

Write-Host ""
Write-Host "RHB_TRIPOSR_LOCAL_READY=True" -ForegroundColor Green
Write-Host "COMFYUI_ROOT=$comfy"
Write-Host "INPUT_DIR=$inputDir"
Write-Host "OUTPUT_DIR=$outputDir"
Write-Host ""
Write-Host "Use TripoSR with low VRAM settings:" -ForegroundColor Cyan
Write-Host "  chunk size: 2048 (or 1024 if CUDA OOM)"
Write-Host "  marching cubes: 192 first test, then 256"
Write-Host "  output: GLB"
