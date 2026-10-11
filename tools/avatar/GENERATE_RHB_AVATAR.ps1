param(
    [Parameter(Mandatory=$true)]
    [string]$Image,

    [string]$Output = "$env:USERPROFILE\Desktop\HectorLobatoHernandez.github.io\assets\models\avatar\hector-avatar-v2.glb",

    [int]$ChunkSize = 1024,
    [int]$Resolution = 192
)

$ErrorActionPreference = "Stop"

$Root = "$env:USERPROFILE\Desktop\RHB_TripoSR"
$Python = Join-Path $Root ".venv\Scripts\python.exe"
$Script = "$env:USERPROFILE\Desktop\HectorLobatoHernandez.github.io\tools\avatar\GENERATE_RHB_AVATAR.py"

if (-not (Test-Path $Python)) { throw "RHB_TRIPOSR_NOT_INSTALLED" }
if (-not (Test-Path $Image)) { throw "IMAGE_NOT_FOUND: $Image" }
if (-not (Test-Path $Script)) { throw "GENERATOR_NOT_FOUND: $Script" }

Write-Host ""
Write-Host "=== GENERATING RHB AVATAR V2 ===" -ForegroundColor Cyan
Write-Host "Image:  $Image"
Write-Host "Output: $Output"
Write-Host "Chunk:  $ChunkSize"
Write-Host "Mesh:   $Resolution"
Write-Host ""

& $Python $Script --image $Image --output $Output --chunk-size $ChunkSize --mc-resolution $Resolution
if ($LASTEXITCODE -ne 0) { throw "TRIPOSR_GENERATION_FAILED_$LASTEXITCODE" }
if (-not (Test-Path $Output)) { throw "TRIPOSR_OUTPUT_NOT_FOUND" }

Write-Host ""
Write-Host "RHB_AVATAR_V2_READY=True" -ForegroundColor Green
Write-Host "GLB=$Output" -ForegroundColor Green