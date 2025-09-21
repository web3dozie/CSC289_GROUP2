<#
run-backend.ps1 - start the Quart backend using Hypercorn
Usage: .\run-backend.ps1 [-Bind '127.0.0.1:5001'] [-Reload:$true]
#>

param(
    [string]$Bind = '127.0.0.1:5001',
    [switch]$Reload = $true,
    [switch]$UseHypercorn = $false
)

Write-Host 'Starting backend with Hypercorn...' -ForegroundColor Cyan

# Locate venv python (relative to repo root)

# Create venv if missing
$venvPath = Join-Path (Get-Location) 'venv'
$venvPython = Join-Path $venvPath 'Scripts\python.exe'
if (-not (Test-Path $venvPython)) {
    Write-Host 'Virtualenv not found. Creating venv at ./venv' -ForegroundColor Yellow
    & (Get-Command python).Source -m venv $venvPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Failed to create venv. Ensure Python is on PATH.' -ForegroundColor Red
        exit 1
    }
}

# Try to activate the venv for this PowerShell session by dot-sourcing Activate.ps1
$activateScript = Join-Path $venvPath 'Scripts\Activate.ps1'
if (Test-Path $activateScript) {
    Write-Host "Activating venv: $activateScript" -ForegroundColor Green
    . $activateScript
} else {
    Write-Host "Activate script not found at $activateScript - continuing without dot-sourcing" -ForegroundColor Yellow
}

# Ensure hypercorn is installed in the venv
# Install backend requirements into venv
$requirementsFile = Join-Path (Join-Path (Get-Location) 'backend') 'requirements.txt'
if (Test-Path $requirementsFile) {
    Write-Host "Installing backend requirements from $requirementsFile into venv..." -ForegroundColor Yellow
    & $venvPython -m pip install -r $requirementsFile
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Failed to install requirements. See pip output.' -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "No requirements.txt found at $requirementsFile - skipping pip install." -ForegroundColor Yellow
}

# Set PYTHONPATH to backend so top-level imports like "from db_async import ..." resolve
$backendPath = (Join-Path (Get-Location) 'backend')
$env:PYTHONPATH = $backendPath
Write-Host ("PYTHONPATH={0}" -f $env:PYTHONPATH) -ForegroundColor Green

# Default DATABASE_URL if not set
if (-not $env:DATABASE_URL) {
    $env:DATABASE_URL = "sqlite+aiosqlite:///" + (Join-Path $backendPath 'taskline.db')
    Write-Host "DATABASE_URL not set, defaulting to: $env:DATABASE_URL" -ForegroundColor Yellow
}
if ($UseHypercorn) {
    # Build hypercorn arguments
    $hypercornModule = 'hypercorn'
    $application = 'backend.app:app'
    $args = @('-m', $hypercornModule, $application, '--bind', $Bind, '--workers', '1', '--worker-class', 'asyncio')
    if ($Reload) { $args += '--reload' }

    Write-Host 'Running Hypercorn...' -ForegroundColor Cyan

    # Try running hypercorn directly (in-process call); if it raises, fallback to Start-Process
    try {
        & $venvPython @args
    } catch {
        Write-Host 'Direct run failed; falling back to Start-Process' -ForegroundColor Yellow
        $proc = Start-Process -FilePath $venvPython -ArgumentList $args -NoNewWindow -Wait -PassThru
        if ($proc.ExitCode -ne 0) {
            Write-Host "Hypercorn exited with code $($proc.ExitCode)" -ForegroundColor Red
            exit $proc.ExitCode
        }
    }

    Write-Host 'Hypercorn exited.' -ForegroundColor Yellow
} else {
    # Default: run the built-in Quart dev server via backend/app.py
    $appScript = Join-Path $backendPath 'app.py'
    if (-not (Test-Path $appScript)) {
        Write-Host "Could not find $appScript" -ForegroundColor Red
        exit 1
    }

    Write-Host "Starting Quart dev server (backend/app.py) on $Bind" -ForegroundColor Cyan
    # The app's main() uses host=127.0.0.1 and port=5001; to respect $Bind we pass environment vars
    $parts = $Bind.Split(':')
    if ($parts.Count -eq 2) {
        $appHost = $parts[0]
        $appPort = $parts[1]
        $env:FLASK_RUN_HOST = $appHost
        $env:FLASK_RUN_PORT = $appPort
    }

    # Start the backend in a child process so we can handle Ctrl+C and stop it cleanly
    $proc = Start-Process -FilePath $venvPython -ArgumentList $appScript -NoNewWindow -PassThru
    Write-Host "Started backend (PID $($proc.Id)); press Ctrl+C to stop" -ForegroundColor Cyan

    # Register handler to stop the child process on Ctrl+C (use Register-ObjectEvent on Console)
    $sourceId = 'StopBackend'
    $null = Register-ObjectEvent -InputObject ([Console]) -EventName 'CancelKeyPress' -SourceIdentifier $sourceId -Action {
        Write-Host 'Ctrl+C pressed — stopping backend...' -ForegroundColor Yellow
        if ($proc -and -not $proc.HasExited) {
            Stop-Process -Id $proc.Id -Force
        }
    }

    try {
        Wait-Process -Id $proc.Id
    } finally {
        Unregister-Event -SourceIdentifier $sourceId -ErrorAction SilentlyContinue
    }

    Write-Host 'Quart dev server exited.' -ForegroundColor Yellow
}

# Build hypercorn arguments
$hypercornModule = 'hypercorn'
$application = 'backend.app:app'
# Prefer using a single worker with asyncio worker class to avoid multiprocessing issues on Windows
$args = @('-m', $hypercornModule, $application, '--bind', $Bind, '--workers', '1', '--worker-class', 'asyncio')
if ($Reload) { $args += '--reload' }

Write-Host 'Running Hypercorn...' -ForegroundColor Cyan

# Try running hypercorn directly (in-process call); if it raises, fallback to Start-Process
try {
    & $venvPython @args
} catch {
    Write-Host 'Direct run failed; falling back to Start-Process' -ForegroundColor Yellow
    $proc = Start-Process -FilePath $venvPython -ArgumentList $args -NoNewWindow -Wait -PassThru
    if ($proc.ExitCode -ne 0) {
        Write-Host "Hypercorn exited with code $($proc.ExitCode)" -ForegroundColor Red
        exit $proc.ExitCode
    }
}

Write-Host 'Hypercorn exited.' -ForegroundColor Yellow
