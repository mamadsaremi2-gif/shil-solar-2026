# SHIL project pages Persian + route fixed installer
# Run from project root: powershell -ExecutionPolicy Bypass -File .\install-project-pages-fixed.ps1

$ErrorActionPreference = "Stop"

if (!(Test-Path "src\pages\project")) {
  throw "Run this script from the project root. src\pages\project was not found."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = "src\pages\project-backup-before-persian-route-fix-$stamp"
New-Item -ItemType Directory -Path $backupDir | Out-Null

$files = @(
  "ProjectPath.jsx",
  "ProjectInfo.jsx",
  "Environment.jsx",
  "CalculationMethod.jsx",
  "CalculationInputs.jsx",
  "SystemSettings.jsx",
  "SummaryPage.jsx",
  "RunCalculation.jsx",
  "ExecutionMethod.jsx",
  "FinalReport.jsx",
  "ProjectSummary.jsx",
  "SolarSystemType.jsx",
  "UnderDevelopment.jsx"
)

foreach ($f in $files) {
  if (Test-Path "src\pages\project\$f") {
    Copy-Item "src\pages\project\$f" "$backupDir\$f" -Force
  }
  if (Test-Path ".\src\pages\project\$f") {
    Copy-Item ".\src\pages\project\$f" "src\pages\project\$f" -Force
  }
}

Write-Host "Backup created at $backupDir"
Write-Host "Project pages replaced. Now run:"
Write-Host "taskkill /F /IM node.exe"
Write-Host "Remove-Item -Recurse -Force .\node_modules\.vite -ErrorAction SilentlyContinue"
Write-Host "npm run dev"
