param()
$ErrorActionPreference = "Stop"
$Root = (Get-Location).Path
$Payload = Join-Path $PSScriptRoot "payload"

Write-Host "SHIL V25.2 Stage 1 Installer" -ForegroundColor Cyan
Write-Host "Project: $Root"

if (!(Test-Path (Join-Path $Root "package.json"))) { throw "Run this installer from the SHIL project root." }
if (!(Test-Path (Join-Path $Root "src\pages\AdminDashboard.jsx"))) { throw "AdminDashboard.jsx not found." }

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Backup = Join-Path $Root "_SHIL_V25_2_STAGE1_BACKUP_$Stamp"
New-Item -ItemType Directory -Path $Backup | Out-Null

$Files = @(
  "src\data\catalogs\consumerEquipmentLibrary.js",
  "src\pages\project\CalculationInputs.jsx",
  "src\pages\LoginPage.jsx",
  "src\pages\AdminDashboard.jsx",
  "src\data\scenarios\adminReadyScenarioLibrary.js",
  "src\pages\Scenarios.jsx",
  "src\services\runtimeAppDataService.js",
  "src\export\shilExportSystem.js",
  "src\styles\shil-v25-2-stage1.css",
  "src\main.jsx",
  "supabase\SHIL_V25_2_STAGE1_READY_SCENARIOS.sql",
  "supabase\SHIL_CENTRAL_APP_DATA_V1.sql",
  "tools\v25-2-stage1-check.mjs",
  "package.json",
  "SHIL_V25_2_STAGE1_REPORT_FA.txt"
)

foreach ($Relative in $Files) {
  $Source = Join-Path $Payload $Relative
  if (!(Test-Path $Source)) { throw "Patch file missing: $Relative" }
  $Target = Join-Path $Root $Relative
  if (Test-Path $Target) {
    $BackupTarget = Join-Path $Backup $Relative
    New-Item -ItemType Directory -Force -Path (Split-Path $BackupTarget -Parent) | Out-Null
    Copy-Item $Target $BackupTarget -Force
  }
  New-Item -ItemType Directory -Force -Path (Split-Path $Target -Parent) | Out-Null
  Copy-Item $Source $Target -Force
}

Write-Host "" 
Write-Host "Patch installed." -ForegroundColor Green
Write-Host "Backup: $Backup" -ForegroundColor DarkGray
Write-Host "" 
Write-Host "IMPORTANT: run this SQL once in Supabase SQL Editor:" -ForegroundColor Yellow
Write-Host "  supabase\SHIL_V25_2_STAGE1_READY_SCENARIOS.sql"
Write-Host "" 
Write-Host "Then run:" -ForegroundColor Yellow
Write-Host "  npm run v25.2:check"
Write-Host "  npm run build"
Write-Host "  npm run dev -- --host"
