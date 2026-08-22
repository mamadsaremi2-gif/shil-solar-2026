param()
$ErrorActionPreference = "Stop"

$Root = (Get-Location).Path
$Admin = Join-Path $Root "src\pages\AdminDashboard.jsx"
$StyleDir = Join-Path $Root "src\appearance\styles"
$CssTarget = Join-Path $StyleDir "shil-admin-summary-parity-v22.css"
$CssSource = Join-Path $PSScriptRoot "shil-admin-summary-parity-v22.css"

Write-Host "SHIL Admin Summary Parity V22" -ForegroundColor Cyan
Write-Host "Project: $Root"

if (!(Test-Path $Admin)) { throw "src\pages\AdminDashboard.jsx not found. Run from project root." }
if (!(Test-Path $CssSource)) { throw "CSS file not found next to installer." }

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Backup = Join-Path $Root "_ADMIN_SUMMARY_PARITY_V22_BACKUP_$Stamp"
New-Item -ItemType Directory -Path $Backup | Out-Null
Copy-Item $Admin (Join-Path $Backup "AdminDashboard.jsx") -Force
if (Test-Path $CssTarget) { Copy-Item $CssTarget (Join-Path $Backup "shil-admin-summary-parity-v22.css") -Force }

New-Item -ItemType Directory -Force -Path $StyleDir | Out-Null
Copy-Item $CssSource $CssTarget -Force

$utf8 = New-Object System.Text.UTF8Encoding($false)
$text = [System.IO.File]::ReadAllText($Admin, $utf8)

# Remove an old V22 import if installer is re-run.
$text = [regex]::Replace($text, '(?m)^\s*import\s+["'']\.\./appearance/styles/shil-admin-summary-parity-v22\.css["''];?\s*\r?\n?', '')

# Add the V22 stylesheet import after the last existing import statement.
$matches = [regex]::Matches($text, '(?m)^import .+?;\s*$')
if ($matches.Count -lt 1) { throw "Import section not found in AdminDashboard.jsx" }
$last = $matches[$matches.Count - 1]
$insertAt = $last.Index + $last.Length
$text = $text.Insert($insertAt, "`r`nimport `"../appearance/styles/shil-admin-summary-parity-v22.css`";")

# Add a section-only class. Hub remains untouched.
$oldRoot = '<div className="shil-admin-v16-root shil-admin-v17-root shil-admin-v18-root shil-admin-v19-root" dir="rtl">'
$newRoot = '<div className={`shil-admin-v16-root shil-admin-v17-root shil-admin-v18-root shil-admin-v19-root ${adminView === "section" ? "shil-admin-summary-parity-v22" : ""}`} dir="rtl">'
if ($text.Contains($oldRoot)) {
  $text = $text.Replace($oldRoot, $newRoot)
} elseif ($text -notmatch 'shil-admin-summary-parity-v22') {
  throw "Admin root marker not found. No JSX changes written."
}

[System.IO.File]::WriteAllText($Admin, $text, $utf8)

Write-Host "" 
Write-Host "Installed successfully." -ForegroundColor Green
Write-Host "Backup: $Backup" -ForegroundColor DarkGray
Write-Host "Scope: Admin child pages only; Hub is unchanged." -ForegroundColor Green
Write-Host "Persian encoding: UTF-8 without BOM." -ForegroundColor Green
Write-Host "" 
Write-Host "Next:" -ForegroundColor Yellow
Write-Host "  npm run build"
Write-Host "  npm run dev -- --host"
