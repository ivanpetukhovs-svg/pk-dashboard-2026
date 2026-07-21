$ErrorActionPreference = "Stop"

$sourceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspaceRoot = Split-Path -Parent $sourceRoot
$releaseRoot = Join-Path $workspaceRoot "releases"
$stableRoot = Join-Path $releaseRoot "pk-dashboard-2026-stable"
$appRoot = Join-Path $stableRoot "app"
$toolsRoot = Join-Path $stableRoot "tools"
$archivePath = Join-Path $releaseRoot "pk-dashboard-2026-stable.zip"

if (Test-Path -LiteralPath $stableRoot) {
  throw "Stable-папка уже существует: $stableRoot. Удалите или переименуйте ее перед новой сборкой."
}

New-Item -ItemType Directory -Path $appRoot -Force | Out-Null
New-Item -ItemType Directory -Path $toolsRoot -Force | Out-Null

$htmlFiles = @(
  "achievements.html",
  "admission-numbers.html",
  "book-viewer.html",
  "document-viewer.html",
  "exam-schedule.html",
  "index.html",
  "loyalty.html",
  "method-guide-teacher.html",
  "method-guide.html",
  "pdf-viewer.html"
)

foreach ($file in $htmlFiles) {
  Copy-Item -LiteralPath (Join-Path $sourceRoot $file) -Destination $appRoot
}

$appDirs = @("assets", "buklets", "data", "docs")
foreach ($dir in $appDirs) {
  Copy-Item -LiteralPath (Join-Path $sourceRoot $dir) -Destination $appRoot -Recurse
}

# The dashboard uses the prepared spread PDFs from /buklets. Keep source
# booklet exports out of /docs so the portable release does not carry them twice.
$duplicateBookletExports = @(
  "docs\Buklet_bakalavriat_2026.pdf",
  "docs\Buklet_magistratura_2026.pdf"
)
foreach ($relativePath in $duplicateBookletExports) {
  $duplicatePath = Join-Path $appRoot $relativePath
  if (Test-Path -LiteralPath $duplicatePath) {
    Remove-Item -LiteralPath $duplicatePath -Force
  }
}

Copy-Item -LiteralPath (Join-Path $sourceRoot "stable-tools\serve.ps1") -Destination $toolsRoot
Copy-Item -LiteralPath (Join-Path $sourceRoot "stable-tools\start.bat") -Destination $stableRoot
Copy-Item -LiteralPath (Join-Path $sourceRoot "stable-tools\README_START.txt") -Destination $stableRoot

Get-ChildItem -LiteralPath $stableRoot -Recurse -File | ForEach-Object {
  $_.IsReadOnly = $true
}

Compress-Archive -LiteralPath $stableRoot -DestinationPath $archivePath -Force

$totalMb = [math]::Round((Get-ChildItem -LiteralPath $stableRoot -Recurse -File | Measure-Object Length -Sum).Sum / 1MB, 2)
$archiveMb = [math]::Round((Get-Item -LiteralPath $archivePath).Length / 1MB, 2)

[PSCustomObject]@{
  StableFolder = $stableRoot
  Archive = $archivePath
  FolderSizeMb = $totalMb
  ArchiveSizeMb = $archiveMb
}
