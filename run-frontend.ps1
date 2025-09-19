# Task Line Development Setup Script
# This script sets up and runs the Task Line frontend development server

Write-Host "==> Task Line Development Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking for Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Node.js found: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "   Please install Node.js from: https://nodejs.org/" -ForegroundColor Red
    Write-Host "   Then run this script again." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is available
Write-Host "Checking for npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: npm found: v$npmVersion" -ForegroundColor Green
    } else {
        throw "npm not found"
    }
} catch {
    Write-Host "ERROR: npm is not available." -ForegroundColor Red
    Write-Host "   npm should come with Node.js. Please reinstall Node.js." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if we're in the right directory
$currentDir = Get-Location
$expectedDirName = "CSC289_GROUP2"
$currentDirName = Split-Path $currentDir -Leaf

if ($currentDirName -ne $expectedDirName) {
    Write-Host "WARNING: You might not be in the correct directory." -ForegroundColor Yellow
    Write-Host "   Expected: $expectedDirName" -ForegroundColor Yellow
    Write-Host "   Current:  $currentDirName" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Script cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Check if frontend directory exists
$frontendPath = Join-Path $currentDir "frontend"
if (-not (Test-Path $frontendPath)) {
    Write-Host "ERROR: Frontend directory not found at: $frontendPath" -ForegroundColor Red
    Write-Host "   Please make sure you're in the correct project directory." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Found frontend directory: $frontendPath" -ForegroundColor Green

# Navigate to frontend directory
Write-Host ""
Write-Host "Changing to frontend directory..." -ForegroundColor Yellow
Set-Location $frontendPath

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found in frontend directory." -ForegroundColor Red
    Write-Host "   Please make sure the project files are complete." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Found package.json" -ForegroundColor Green

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Yellow

try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
} catch {
    Write-Host "ERROR: Failed to install dependencies." -ForegroundColor Red
    Write-Host "   Please check your internet connection and try again." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "SUCCESS: Dependencies installed successfully!" -ForegroundColor Green

# Start development server
Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Yellow
Write-Host "   The app will be available at: http://localhost:5173/" -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host ""

try {
    # Start the dev server
    npm run dev
} catch {
    Write-Host "ERROR: Failed to start development server." -ForegroundColor Red
    Write-Host "   Please check the error messages above." -ForegroundColor Red
}

Write-Host ""
Write-Host "Development server stopped." -ForegroundColor Yellow
Write-Host "   Thanks for using Task Line!" -ForegroundColor Cyan