# TaskLine - Windows PowerShell Installer
# Install TaskLine - a local-first task management app
# Usage: iwr -useb https://mytaskline.app/install.ps1 | iex

$ErrorActionPreference = "Stop"

# Configuration
$ContainerName = "taskline"
$ImageName = "web3dozie/taskline:latest"
$Port = "3456"
$InternalPort = "3456"
$VolumeName = "taskline-data"
$LocalDomain = "my.taskline.local"

# Banner
Write-Host ""
Write-Host "+========================================+" -ForegroundColor Cyan
Write-Host "|                                        |" -ForegroundColor Cyan
Write-Host "|   TTTTTTT   A    SSSS  K   K          |" -ForegroundColor Cyan
Write-Host "|     T     A  A  S      K  K           |" -ForegroundColor Cyan
Write-Host "|     T    AAAAAA  SSS   KKK            |" -ForegroundColor Cyan
Write-Host "|     T    A    A     S  K  K           |" -ForegroundColor Cyan
Write-Host "|     T    A    A SSSS   K   K          |" -ForegroundColor Cyan
Write-Host "|                                        |" -ForegroundColor Cyan
Write-Host "|   LINE - Lock in. Get it done.        |" -ForegroundColor Cyan
Write-Host "|   Stay zen.                            |" -ForegroundColor Cyan
Write-Host "|                                        |" -ForegroundColor Cyan
Write-Host "+========================================+" -ForegroundColor Cyan
Write-Host ""
Write-Host "TaskLine Installer" -ForegroundColor Blue
Write-Host ""

# Check if Docker is installed
Write-Host "> Checking for Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "[OK] Docker found" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Docker Desktop for Windows:"
    Write-Host "  https://docs.docker.com/desktop/install/windows-install/"
    Write-Host ""
    Write-Host "Press Enter to exit..." -ForegroundColor Gray
    Read-Host
    exit 1
}

# Check if Docker is running
Write-Host "> Checking if Docker is running..." -ForegroundColor Yellow
$dockerRunning = $false
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
        Write-Host "[OK] Docker is running" -ForegroundColor Green
    }
} catch {
    # Docker command failed
}

if (-not $dockerRunning) {
    Write-Host "[ERROR] Docker is not running." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start Docker Desktop and try again:" -ForegroundColor Yellow
    Write-Host "  1. Start Docker Desktop from the Start menu" -ForegroundColor Cyan
    Write-Host "  2. Wait for the whale icon to show in the system tray" -ForegroundColor Cyan
    Write-Host "  3. Run this installer again" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Enter to exit..." -ForegroundColor Gray
    Read-Host
    exit 1
}

# Check for existing container
Write-Host "> Checking for existing TaskLine installation..." -ForegroundColor Yellow
$existingContainer = docker ps -a --format "{{.Names}}" | Where-Object { $_ -eq $ContainerName }

if ($existingContainer) {
    Write-Host "! Found existing TaskLine container" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "What would you like to do?"
    Write-Host "  1) Update to latest version (keeps your data)"
    Write-Host "  2) Reinstall (removes container, keeps data)"
    Write-Host "  3) Cancel installation"
    Write-Host ""

    $choice = Read-Host "Enter choice [1-3]"

    # Default to update if no input (piped install)
    if ([string]::IsNullOrWhiteSpace($choice)) {
        $choice = "1"
        Write-Host "No input detected, defaulting to update..." -ForegroundColor Cyan
    }

    switch ($choice) {
        "1" {
            Write-Host "> Updating TaskLine..." -ForegroundColor Yellow
            docker stop $ContainerName 2>$null | Out-Null
            docker rm $ContainerName 2>$null | Out-Null
        }
        "2" {
            Write-Host "> Reinstalling TaskLine..." -ForegroundColor Yellow
            docker stop $ContainerName 2>$null | Out-Null
            docker rm $ContainerName 2>$null | Out-Null
        }
        "3" {
            Write-Host "Installation cancelled." -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Press Enter to exit..." -ForegroundColor Gray
            Read-Host
            exit 0
        }
        default {
            Write-Host "Invalid choice. Defaulting to update..." -ForegroundColor Yellow
            docker stop $ContainerName 2>$null | Out-Null
            docker rm $ContainerName 2>$null | Out-Null
        }
    }
}

# Pull latest image
Write-Host "> Pulling latest TaskLine image..." -ForegroundColor Yellow
docker pull $ImageName
Write-Host "[OK] Image downloaded" -ForegroundColor Green

# Start container
Write-Host "> Starting TaskLine..." -ForegroundColor Yellow
docker run -d `
    --name $ContainerName `
    -p "80:${InternalPort}" `
    -p "${Port}:${InternalPort}" `
    -v "${VolumeName}:/data" `
    --restart unless-stopped `
    $ImageName | Out-Null

# Wait for container to be healthy
Write-Host "> Waiting for TaskLine to start..." -ForegroundColor Yellow
$maxWait = 60
$counter = 0
$healthy = $false

while ($counter -lt $maxWait) {
    try {
        $response = docker exec $ContainerName curl -sf http://localhost:${InternalPort}/health 2>$null
        if ($response) {
            Write-Host "[OK] TaskLine is ready!" -ForegroundColor Green
            $healthy = $true
            break
        }
    } catch {}

    Start-Sleep -Seconds 1
    $counter++

    if ($counter % 5 -eq 0) {
        Write-Host "  Still waiting... ($counter`s)"
    }
}

if (-not $healthy) {
    Write-Host "[ERROR] TaskLine failed to start within $maxWait seconds" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check logs with: docker logs $ContainerName"
    Write-Host ""
    Write-Host "Press Enter to exit..." -ForegroundColor Gray
    Read-Host
    exit 1
}

# Set up local domain
Write-Host "> Setting up local domain..." -ForegroundColor Yellow
$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$hostsContent = Get-Content $hostsPath -ErrorAction SilentlyContinue
if ($hostsContent -notmatch $LocalDomain) {
    try {
        Add-Content -Path $hostsPath -Value "`n127.0.0.1 $LocalDomain" -ErrorAction Stop
        Write-Host "[OK] Added $LocalDomain to hosts file" -ForegroundColor Green
    } catch {
        Write-Host "! Could not modify hosts file. Run PowerShell as Administrator to add $LocalDomain" -ForegroundColor Yellow
        Write-Host "  Or manually add this line to $hostsPath :" -ForegroundColor Yellow
        Write-Host "  127.0.0.1 $LocalDomain" -ForegroundColor Yellow
    }
} else {
    Write-Host "[OK] $LocalDomain already in hosts file" -ForegroundColor Green
}

# Success message
Write-Host ""
Write-Host "+========================================================+" -ForegroundColor Green
Write-Host "|                                                        |" -ForegroundColor Green
Write-Host "|  SUCCESS - TaskLine installed successfully!           |" -ForegroundColor Green
Write-Host "|                                                        |" -ForegroundColor Green
Write-Host "+========================================================+" -ForegroundColor Green
Write-Host ""
Write-Host "> Access TaskLine:" -ForegroundColor Cyan
Write-Host "  http://$LocalDomain" -ForegroundColor Green
Write-Host "  http://localhost:$Port" -ForegroundColor Green
Write-Host ""
Write-Host "> Data Location:" -ForegroundColor Cyan
Write-Host "  Docker Volume: $VolumeName" -ForegroundColor Yellow
Write-Host ""
Write-Host "> Useful Commands:" -ForegroundColor Cyan
Write-Host "  * View logs:    docker logs $ContainerName" -ForegroundColor Yellow
Write-Host "  * Stop:         docker stop $ContainerName" -ForegroundColor Yellow
Write-Host "  * Start:        docker start $ContainerName" -ForegroundColor Yellow
Write-Host "  * Restart:      docker restart $ContainerName" -ForegroundColor Yellow
Write-Host "  * Uninstall:    docker rm -f $ContainerName" -ForegroundColor Yellow
Write-Host ""
Write-Host "> Backup Your Data:" -ForegroundColor Cyan
Write-Host "  docker run --rm -v ${VolumeName}:/data -v `${PWD}:/backup ubuntu tar czf /backup/taskline-backup.tar.gz -C /data ." -ForegroundColor Yellow
Write-Host ""

# Install CLI wrapper automatically
Write-Host "> Installing 'taskline' command..." -ForegroundColor Cyan
$installCli = "Y"

if ($installCli -match '^[Yy]$') {
    $binDir = "$env:USERPROFILE\.local\bin"
    $cliPath = "$binDir\_taskline.ps1"  # Underscore prefix so .bat takes priority

    # Create directory if it doesn't exist
    if (-not (Test-Path $binDir)) {
        New-Item -ItemType Directory -Path $binDir -Force | Out-Null
    }

    # Create CLI script
    $cliContent = @'
# TaskLine CLI Wrapper

param(
    [Parameter(Position=0)]
    [string]$Command
)

$ContainerName = "taskline"
$ImageName = "web3dozie/taskline:latest"
$Port = "3456"
$InternalPort = "3456"
$VolumeName = "taskline-data"
$LocalDomain = "my.taskline.local"

switch ($Command) {
    "start" {
        Write-Host "Starting TaskLine..."
        try {
            docker start $ContainerName 2>$null
        } catch {
            docker run -d --name $ContainerName -p "80:${InternalPort}" -p "${Port}:${InternalPort}" -v "${VolumeName}:/data" --restart unless-stopped $ImageName | Out-Null
        }
        Write-Host "TaskLine is running at http://$LocalDomain"
    }
    "stop" {
        Write-Host "Stopping TaskLine..."
        docker stop $ContainerName
    }
    "restart" {
        Write-Host "Restarting TaskLine..."
        docker restart $ContainerName
    }
    "status" {
        $running = docker ps --format "{{.Names}}" | Where-Object { $_ -eq $ContainerName }
        if ($running) {
            Write-Host "TaskLine is running"
            Write-Host "URL: http://$LocalDomain"
            docker ps --filter "name=$ContainerName" --format "table {{.Status}}`t{{.Ports}}"
        } else {
            Write-Host "TaskLine is not running"
        }
    }
    "logs" {
        docker logs -f $ContainerName
    }
    "update" {
        Write-Host "Updating TaskLine..."
        docker pull $ImageName
        docker stop $ContainerName
        docker rm $ContainerName
        docker run -d --name $ContainerName -p "80:${InternalPort}" -p "${Port}:${InternalPort}" -v "${VolumeName}:/data" --restart unless-stopped $ImageName | Out-Null
        Write-Host "TaskLine updated and running at http://$LocalDomain"
    }
    "uninstall" {
        $confirm = Read-Host "Remove TaskLine container? Data will be preserved. [y/N]"
        if ($confirm -match '^[Yy]$') {
            docker rm -f $ContainerName
            Write-Host "TaskLine removed. Data volume '$VolumeName' preserved."
            Write-Host "To remove data: docker volume rm $VolumeName"
        }
    }
    "backup" {
        $backupFile = "taskline-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').tar.gz"
        Write-Host "Backing up TaskLine data..."
        docker run --rm -v "${VolumeName}:/data" -v "${PWD}:/backup" ubuntu tar czf "/backup/$backupFile" -C /data .
        Write-Host "Backup saved: $backupFile"
    }
    default {
        Write-Host "TaskLine CLI - Manage your TaskLine installation"
        Write-Host ""
        Write-Host "Usage: taskline <command>"
        Write-Host ""
        Write-Host "Commands:"
        Write-Host "  start      - Start TaskLine"
        Write-Host "  stop       - Stop TaskLine"
        Write-Host "  restart    - Restart TaskLine"
        Write-Host "  status     - Check TaskLine status"
        Write-Host "  logs       - View TaskLine logs"
        Write-Host "  update     - Update to latest version"
        Write-Host "  backup     - Backup TaskLine data"
        Write-Host "  uninstall  - Remove TaskLine (keeps data)"
    }
}
'@

    Set-Content -Path $cliPath -Value $cliContent

    # Clean up old PowerShell profile aliases (from previous install attempts)
    if (Test-Path $PROFILE) {
        try {
            $profileContent = Get-Content $PROFILE -Raw -ErrorAction SilentlyContinue
            if ($profileContent -match 'taskline') {
                # Remove old TaskLine alias entries
                $profileContent = $profileContent -replace "(?ms)# TaskLine CLI.*?Set-Alias -Name taskline.*?\r?\n", ""
                Set-Content $PROFILE -Value $profileContent
                Write-Host "[OK] Cleaned old PowerShell profile entries" -ForegroundColor Green
            }
        } catch {
            # Ignore errors if profile can't be cleaned
        }
    }

    # Create batch file wrapper to bypass execution policy
    $batPath = "$binDir\taskline.bat"
    $batContent = "@echo off`r`npowershell.exe -ExecutionPolicy Bypass -File `"%~dp0_taskline.ps1`" %*"
    Set-Content -Path $batPath -Value $batContent

    # Remove old taskline.ps1 if it exists (from previous install)
    $oldPs1 = "$binDir\taskline.ps1"
    if (Test-Path $oldPs1) {
        Remove-Item $oldPs1 -Force
        Write-Host "[OK] Removed old taskline.ps1" -ForegroundColor Green
    }

    # Add to PATH if not already there
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($userPath -notlike "*$binDir*") {
        try {
            [Environment]::SetEnvironmentVariable('Path', "$userPath;$binDir", 'User')
            Write-Host "[OK] Added to PATH" -ForegroundColor Green
        } catch {
            Write-Host ""
            Write-Host "! Could not add to PATH automatically" -ForegroundColor Yellow
            Write-Host "  Add manually: Settings > System > Environment Variables" -ForegroundColor Cyan
            Write-Host "  Add this to your PATH: $binDir" -ForegroundColor Cyan
        }
    }

    # Remove alias from current session if it exists
    if (Get-Alias -Name taskline -ErrorAction SilentlyContinue) {
        Remove-Alias -Name taskline -Force
        Write-Host "[OK] Removed old alias from current session" -ForegroundColor Green
    }

    Write-Host "[OK] CLI installed: $batPath" -ForegroundColor Green
    Write-Host "  Run 'taskline' to see available commands" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  IMPORTANT: Close and reopen PowerShell for 'taskline' command to work" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "*** Setup complete! Open your browser to get started." -ForegroundColor Green
Write-Host ""
