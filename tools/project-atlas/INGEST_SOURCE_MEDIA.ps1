param(
  [Parameter(Mandatory=$true)][string]$SourceDir,
  [switch]$SkipVideo
)
$ErrorActionPreference='Stop'
$Repo=(Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Python=(Get-Command python -ErrorAction Stop).Source
$Args=@((Join-Path $PSScriptRoot 'build_source_media.py'),$SourceDir,'--repo',$Repo)
if($SkipVideo){$Args+='--skip-video'}
& $Python @Args
if($LASTEXITCODE -ne 0){throw 'PROJECT_ATLAS_MEDIA_BUILD_FAILED'}
Write-Host 'Media derivatives built from real source files only.'
Write-Host 'Review assets/project-atlas/manifest.json before git add.'
