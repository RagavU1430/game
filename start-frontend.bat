@echo off
title Start Frontend Only
echo Starting Next.js Frontend...
echo.
cd /d "%~dp0"
npx next dev
pause
