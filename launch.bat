@echo off
title GAME FLOW - NEXT GEN
echo [1/3] Loading Backend Server...
cd game-flow-next
start "BACKEND" cmd /k "node server.js"
echo [2/3] Initializing Frontend...
cmd /c "npm install"
echo [3/3] Launching Next.js UI...
cmd /k "npm run dev"
pause
