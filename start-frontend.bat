@echo off
title CyberGuard Frontend
cd /d "%~dp0frontend"
echo Starting CyberGuard Frontend on http://localhost:5173
echo Press Ctrl+C to stop.
echo.
npm run dev
pause
