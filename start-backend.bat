@echo off
title Start Backend Only
echo Starting Backend Server...
echo.
cd /d "%~dp0"
node server.js
pause
