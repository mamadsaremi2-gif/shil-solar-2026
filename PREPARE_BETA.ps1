$ErrorActionPreference = "Stop"

function Invoke-Step {
    param(
        [string]$Label,
        [scriptblock]$Action
    )
    Write-Host ""
    Write-Host $Label -ForegroundColor Yellow
    & $Action
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE"
    }
}

Write-Host ""
Write-Host "=== SHIL BETA RELEASE PREPARATION V25.1 ===" -ForegroundColor Cyan

if (-not (Test-Path ".\package.json")) {
    throw "package.json not found. Run this script from the SHIL project root."
}

Write-Host "[1/7] Checking local environment..." -ForegroundColor Yellow
$envFile = $null
if (Test-Path ".\.env.local") {
    $envFile = ".\.env.local"
} elseif (Test-Path ".\.env") {
    $envFile = ".\.env"
}

if (-not $envFile) {
    throw ".env.local or .env was not found."
}

$envText = [System.IO.File]::ReadAllText((Resolve-Path $envFile))
if ($envText -notmatch "(?m)^VITE_SUPABASE_URL=.+$") {
    throw "VITE_SUPABASE_URL is missing from the environment file."
}
if ($envText -notmatch "(?m)^VITE_SUPABASE_ANON_KEY=.+$") {
    throw "VITE_SUPABASE_ANON_KEY is missing from the environment file."
}
Write-Host "Environment OK: $envFile" -ForegroundColor Green

Invoke-Step "[2/7] Installing exact dependencies..." {
    & npm.cmd ci --no-audit --no-fund
}

Invoke-Step "[3/7] Checking restored consumer bank..." {
    & npm.cmd run consumer:check
}

Invoke-Step "[4/7] Running beta readiness checks..." {
    & npm.cmd run beta:check
}

Invoke-Step "[5/7] Running engine smoke test..." {
    & npm.cmd run engine:smoke
}

Invoke-Step "[6/7] Creating production build..." {
    & npm.cmd run build
}

if (-not (Test-Path ".\dist\index.html")) {
    throw "Build completed but dist/index.html was not found."
}

Write-Host ""
Write-Host "[7/7] Creating tester build archive..." -ForegroundColor Yellow
$out = Join-Path (Split-Path (Get-Location) -Parent) "SHIL_BETA_DIST.zip"
if (Test-Path $out) {
    Remove-Item $out -Force
}
Compress-Archive -Path ".\dist\*" -DestinationPath $out -CompressionLevel Optimal

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "SHIL BETA PREPARATION PASSED" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host "Build directory: .\dist" -ForegroundColor Cyan
Write-Host "Tester archive: $out" -ForegroundColor Cyan
Write-Host "Next step: deploy the project to Vercel and test the HTTPS PWA build." -ForegroundColor Yellow
