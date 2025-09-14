# Frontend Development Instructions

## Quick Start

To run the Task Line frontend development server:

1. **Navigate to the project root directory** (where this file is located)

2. **Run the development script**:
   ```powershell
   .\run-dev.ps1
   ```

   Or simply double-click the `run-dev.ps1` file in Windows Explorer.

## What the Script Does

The `run-dev.ps1` script will:
- Check if Node.js and npm are installed
- Verify you're in the correct project directory
- Install dependencies automatically (`npm install`)
- Start the development server at `http://localhost:5173/`

## Manual Alternative

If you prefer to run commands manually:

```bash
cd frontend
npm install
npm run dev
```

## Accessing the Application

Once the server starts, open your browser and go to:
- **Landing Page**: `http://localhost:5173/`
- **Login Page**: `http://localhost:5173/login`

## Troubleshooting

- **Script won't run**: Make sure you have PowerShell execution policy set to allow scripts
- **Node.js not found**: Install Node.js from https://nodejs.org/
- **Port 5173 busy**: The script will show an error if the port is in use

## Development

- The server supports hot reloading - changes are reflected immediately
- Press `Ctrl+C` in the terminal to stop the server
- Check the console for any error messages

