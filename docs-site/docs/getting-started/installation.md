# Installation Guide

TaskLine runs entirely on the local computer in a single Docker container. No cloud, no accounts, all data stays local.

## Requirements

- **Docker Desktop** (that's it!)
  - [Install for macOS](https://docs.docker.com/desktop/install/mac-install/)
  - [Install for Windows](https://docs.docker.com/desktop/install/windows-install/)
  - [Install for Linux](https://docs.docker.com/engine/install/)

## One-Command Installation

### macOS / Linux

Open Terminal and run:
```bash
curl -fsSL https://mytaskline.app/install.sh | bash
```

### Windows (PowerShell)

Open PowerShell and run:
```powershell
iwr -useb https://mytaskline.app/install.ps1 | iex
```

### Or Run Directly with Docker
```bash
docker run -d --name taskline -p 3456:3456 -v taskline-data:/data web3dozie/taskline:latest
```

Then open **http://localhost:3456** in the browser.

## After Installation

Access TaskLine at:

- `http://my.taskline.local`
- `http://localhost:3456`

## Managing TaskLine

After installation, use the `taskline` command:

| Command | Description |
|---------|-------------|
| `taskline start` | Start TaskLine |
| `taskline stop` | Stop TaskLine |
| `taskline status` | Check if running |
| `taskline update` | Update to latest version |
| `taskline backup` | Backup data |
| `taskline logs` | View logs |
| `taskline uninstall` | Remove TaskLine (keeps data) |

## Troubleshooting Installation

If installation fails, check:

1. Docker Desktop is installed and running
2. Internet connection is working
3. No other service is using port 3456

For more help, see [Troubleshooting](../troubleshooting.md).
