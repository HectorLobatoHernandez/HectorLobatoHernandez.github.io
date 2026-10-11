$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== RHB AVATAR FREE 3D PIPELINE V2 ===" -ForegroundColor Cyan
Write-Host "ComfyUI + Flowty TripoSR / local / no subscription" -ForegroundColor Cyan
Write-Host ""

$UserHome = $env:USERPROFILE
$InstallRoot = Join-Path $UserHome "Desktop\ComfyUI_RHB"
$Comfy = $InstallRoot
$Venv = Join-Path $Comfy ".venv"
$VenvPython = Join-Path $Venv "Scripts\python.exe"

function Assert-LastExitCode([string]$Step) {
    if ($LASTEXITCODE -ne 0) {
        throw "$Step failed with exit code $LASTEXITCODE"
    }
}

$candidates = @(
    "$UserHome\ComfyUI",
    "$UserHome\Desktop\ComfyUI",
    "$UserHome\Desktop\ComfyUI_RHB",
    "$UserHome\Documents\ComfyUI",
    "$UserHome\Downloads\ComfyUI",
    "$UserHome\Pinokio\api\comfyui.git\app",
    "$UserHome\pinokio\api\comfyui.git\app",
    "$UserHome\Desktop\ComfyUI_windows_portable\ComfyUI",
    "$UserHome\Downloads\ComfyUI_windows_portable\ComfyUI"
)

$existing = $candidates |
    Where-Object { Test-Path (Join-Path $_ "main.py") } |
    Select-Object -First 1

if ($existing) {
    $Comfy = $existing
    Write-Host "[OK] Existing ComfyUI: $Comfy" -ForegroundColor Green
}
else {
    Write-Host "ComfyUI not found. Installing isolated copy:" -ForegroundColor Yellow
    Write-Host "  $InstallRoot" -ForegroundColor Yellow

    if (-not (Test-Path $InstallRoot)) {
        git clone https://github.com/Comfy-Org/ComfyUI.git $InstallRoot
        Assert-LastExitCode "ComfyUI clone"
    }

    if (-not (Test-Path (Join-Path $InstallRoot "main.py"))) {
        throw "COMFYUI_INSTALL_FAILED"
    }

    $Comfy = $InstallRoot
}

$Venv = Join-Path $Comfy ".venv"
$VenvPython = Join-Path $Venv "Scripts\python.exe"
$CustomNodes = Join-Path $Comfy "custom_nodes"
$TripoNode = Join-Path $CustomNodes "ComfyUI-Flowty-TripoSR"
$ModelDir = Join-Path $Comfy "models\checkpoints"
$ModelPath = Join-Path $ModelDir "triposr-model.ckpt"

if (-not (Test-Path $VenvPython)) {
    Write-Host "Creating isolated Python 3.12 environment..." -ForegroundColor Yellow

    $py = Get-Command py -ErrorAction SilentlyContinue
    if ($py) {
        & py -3.12 -c "import sys; print(sys.executable)"
        if ($LASTEXITCODE -eq 0) {
            & py -3.12 -m venv $Venv
            Assert-LastExitCode "Python venv creation"
        }
    }

    if (-not (Test-Path $VenvPython)) {
        $python = Get-Command python -ErrorAction SilentlyContinue
        if (-not $python) { throw "PYTHON_3_12_NOT_FOUND" }

        $ver = & $python.Source -c "import sys; print(str(sys.version_info.major)+'.'+str(sys.version_info.minor))"
        if ($ver -ne "3.12") { throw "PYTHON_3_12_NOT_FOUND" }

        & $python.Source -m venv $Venv
        Assert-LastExitCode "Python venv creation"
    }
}

Write-Host "[OK] Python: $VenvPython" -ForegroundColor Green

& $VenvPython -m pip install --upgrade pip setuptools wheel
Assert-LastExitCode "pip bootstrap"

$cudaReady = $false
try {
    $cudaCheck = & $VenvPython -c "import torch; print(torch.cuda.is_available())" 2>$null
    if ($LASTEXITCODE -eq 0 -and $cudaCheck -contains "True") {
        $cudaReady = $true
    }
}
catch {}

if (-not $cudaReady) {
    Write-Host "Installing NVIDIA CUDA PyTorch..." -ForegroundColor Yellow
    & $VenvPython -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126
    Assert-LastExitCode "PyTorch CUDA install"
}

Write-Host "Installing ComfyUI dependencies..." -ForegroundColor Yellow
& $VenvPython -m pip install -r (Join-Path $Comfy "requirements.txt")
Assert-LastExitCode "ComfyUI requirements"

New-Item -ItemType Directory -Force -Path $CustomNodes | Out-Null

if (-not (Test-Path $TripoNode)) {
    Write-Host "Installing lightweight Flowty TripoSR..." -ForegroundColor Yellow
    git clone https://github.com/flowtyone/ComfyUI-Flowty-TripoSR.git $TripoNode
    Assert-LastExitCode "Flowty TripoSR clone"
}
else {
    Write-Host "Updating Flowty TripoSR..." -ForegroundColor Yellow
    git -C $TripoNode pull
    Assert-LastExitCode "Flowty TripoSR update"
}

& $VenvPython -m pip install -r (Join-Path $TripoNode "requirements.txt")
Assert-LastExitCode "TripoSR requirements"

& $VenvPython -m pip install rembg onnxruntime
Assert-LastExitCode "rembg install"

New-Item -ItemType Directory -Force -Path $ModelDir | Out-Null

if (-not (Test-Path $ModelPath)) {
    Write-Host "Downloading TripoSR checkpoint..." -ForegroundColor Yellow
    $downloadCode = "from huggingface_hub import hf_hub_download; import shutil; src=hf_hub_download(repo_id='stabilityai/TripoSR', filename='model.ckpt'); shutil.copy2(src, r'$ModelPath'); print(r'$ModelPath')"
    & $VenvPython -c $downloadCode
    Assert-LastExitCode "TripoSR model download"
}

Write-Host "Verifying GPU..." -ForegroundColor Yellow
& $VenvPython -c "import torch; print('TORCH='+torch.__version__); print('CUDA_AVAILABLE='+str(torch.cuda.is_available())); print('GPU='+(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')); print('VRAM_GB='+(str(round(torch.cuda.get_device_properties(0).total_memory/1024**3,2)) if torch.cuda.is_available() else '0'))"
Assert-LastExitCode "CUDA verification"

$Launcher = Join-Path $Comfy "START_RHB_TRIPOSR.ps1"
$launcherLines = @(
    '$ErrorActionPreference = "Stop"',
    'Set-Location "' + $Comfy + '"',
    '& "' + $VenvPython + '" main.py --lowvram'
)
Set-Content -Path $Launcher -Value $launcherLines -Encoding UTF8

Write-Host ""
Write-Host "RHB_TRIPOSR_LOCAL_READY=True" -ForegroundColor Green
Write-Host "COMFYUI_ROOT=$Comfy"
Write-Host "PYTHON=$VenvPython"
Write-Host "TRIPOSR_NODE=$TripoNode"
Write-Host "TRIPOSR_MODEL=$ModelPath"
Write-Host "LAUNCHER=$Launcher"
Write-Host ""
Write-Host "GTX 1660 SUPER defaults:" -ForegroundColor Cyan
Write-Host "  chunk_size = 1024"
Write-Host "  geometry_resolution = 192"
Write-Host "  threshold = 25"
