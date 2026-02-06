@echo off
title Connection Test
echo Testing server connection...
echo.

REM Test if server is running
curl -s http://localhost:5000/api/game-status >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend server is running on port 5000
) else (
    echo [ERROR] Backend server is NOT running!
    echo Please start the server with: node server.js
)

echo.
echo Testing frontend...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend is running on port 3000
) else (
    echo [ERROR] Frontend is NOT running!
    echo Please start the frontend with: npm run dev
)

echo.
pause
