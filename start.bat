@echo off
REM Quick launcher for Windows

echo ╔═══════════════════════════════════════════════════════╗
echo ║  Medical Device Lead Generator - Web App Launcher     ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

REM Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js found
node --version
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    echo.
)

echo 🚀 Starting web app...
echo.
echo    Opening browser at: http://localhost:3000
echo.

REM Open browser after 2 seconds
timeout /t 2 /nobreak >nul
start http://localhost:3000

REM Start the webapp
call npm run webapp
