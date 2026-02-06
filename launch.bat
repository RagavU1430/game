@echo off
title GAME FLOW - NEXT GEN LAUNCHER
color 0A

echo ============================================
echo    GAME FLOW - NEXT GEN LAUNCHER
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Checking Node.js installation...
node --version
echo.

echo [2/4] Installing dependencies (if needed)...
REM Use cmd /c to bypass PowerShell execution policy
cmd /c "cd /d "%~dp0" && npm install"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies!
    pause
    exit /b 1
)
echo.

echo [3/4] Starting Backend Server on port 5000...
start "GAME FLOW - BACKEND SERVER" cmd /k "cd /d "%~dp0" && echo Backend Server Running... && node server.js"
timeout /t 3 /nobreak >nul
echo Backend server started!
echo.

echo [4/4] Starting Frontend on port 3000...
echo.
echo ============================================
echo   APPLICATION READY!
echo   - Backend:  http://localhost:5000
echo   - Frontend: http://localhost:3000
echo   - Game:     http://localhost:3000/game
echo   - Host:     http://localhost:3000/leaderboard
echo ============================================
echo.

REM Use npx to bypass PowerShell restrictions
start "GAME FLOW - FRONTEND" cmd /k "cd /d "%~dp0" && echo Frontend Running... && npx next dev"

echo.
echo Both servers are starting in separate windows...
echo Close those windows to stop the servers.
echo.
pause
