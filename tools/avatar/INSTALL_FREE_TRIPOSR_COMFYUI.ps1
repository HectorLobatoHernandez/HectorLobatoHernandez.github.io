$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== RHB TRIPOSR STANDALONE V3 ===" -ForegroundColor Cyan
Write-Host "Image -> GLB / local / free / no ComfyUI" -ForegroundColor Cyan
Write-Host ""

$UserHome = $env:USERPROFILE
$Root = Join-Path $UserHome "Desktop\RHB_TripoSR"
$Repo = Join-Path $Root "ComfyUI-Flowty-TripoSR"
$Venv = Join-Path $Root ".venv"
$Python = Join-Path $Venv "Scripts\python.exe"

function Check([string]$Step) {
    if ($LASTEXITCODE -ne 0) { throw "$Step failed with exit code $LASTEXITCODE" }
}

New-Item -ItemType Directory -Force -Path $Root | Out-Null

if (-not (Test-Path $Python)) {
    $py = Get-Command py -ErrorAction SilentlyContinue
    if (-not $py) { throw "PY_LAUNCHER_NOT_FOUND" }
    Write-Host "Creating Python 3.12 venv..." -ForegroundColor Yellow
    & py -3.12 -m venv $Venv
    Check "venv creation"
}

Write-Host "[OK] Python: $Python" -ForegroundColor Green
& $Python -m pip install --upgrade pip setuptools wheel
Check "pip bootstrap"

Write-Host "Installing CUDA PyTorch (cached if already downloaded)..." -ForegroundColor Yellow
& $Python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126
Check "PyTorch install"

if (-not (Test-Path $Repo)) {
    Write-Host "Cloning lightweight TripoSR source..." -ForegroundColor Yellow
    git clone --branch master https://github.com/flowtyone/ComfyUI-Flowty-TripoSR.git $Repo
    Check "TripoSR clone"
} else {
    git -C $Repo pull
    Check "TripoSR update"
}

Write-Host "Installing Python 3.12 compatible TripoSR stack..." -ForegroundColor Yellow
& $Python -m pip install "numpy<2.0" "omegaconf==2.3.0" "Pillow>=10.1,<12" "einops>=0.7,<0.9" "transformers==4.39.3" "tokenizers==0.15.2" "trimesh>=4.0,<5" "huggingface-hub>=0.22,<1" "imageio[ffmpeg]>=2.31" "scikit-image>=0.22" "rembg>=2.0.50" "onnxruntime>=1.17"
Check "TripoSR dependencies"

Write-Host "Verifying imports..." -ForegroundColor Yellow
$env:PYTHONPATH = $Repo
& $Python -c "import torch, transformers, tokenizers, trimesh, skimage, rembg; from tsr.system import TSR; print('TRIPOSR_IMPORT_OK=True'); print('TORCH='+torch.__version__); print('TRANSFORMERS='+transformers.__version__); print('TOKENIZERS='+tokenizers.__version__); print('CUDA_AVAILABLE='+str(torch.cuda.is_available())); print('GPU='+(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')); print('VRAM_GB='+(str(round(torch.cuda.get_device_properties(0).total_memory/1024**3,2)) if torch.cuda.is_available() else '0'))"
Check "TripoSR verification"

Write-Host ""
Write-Host "RHB_TRIPOSR_STANDALONE_READY=True" -ForegroundColor Green
Write-Host "ROOT=$Root"
Write-Host "PYTHON=$Python"
Write-Host "SOURCE=$Repo"