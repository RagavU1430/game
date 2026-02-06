@echo off
title Start Frontend Only
echo Starting Next.js Frontend...
echo.
cd /d "%~dp0"
npx next dev -H 0.0.0.0
pause
