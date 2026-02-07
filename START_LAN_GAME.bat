@echo off
echo ===================================================
echo   STARTING GAME FLOW SYSTEM (LAN MODE)
echo ===================================================
echo.

:: Get local IP Address
for /f "tokens=14" %%a in ('ipconfig ^| findstr IPv4') do set IP=%%a

echo [INFO] Your Local IP is: %IP%
echo [INFO] Participants should connect to: http://%IP%:3000
echo.

echo [1/2] Starting Backend Server (Port 8080)...
start "Game Backend" cmd /k "node server.js"

echo [2/2] Starting Frontend (Port 3000)...
echo        Please wait for 'Ready in ...' message.
echo.

:: Run npm directly
npm run dev
