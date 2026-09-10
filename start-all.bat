@echo off
title CyberGuard - Starting Services
echo ============================================
echo   CyberGuard Security Platform
echo ============================================
echo.
echo Starting CyberGuard Backend...
start "CyberGuard Backend" cmd /k "cd /d "%~dp0backend" && python run.py"
timeout /t 3 /nobreak > nul
echo Starting CyberGuard Frontend...
start "CyberGuard Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo.
echo ============================================
echo   CyberGuard is starting up...
echo.
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo ============================================
echo.
echo Both services are starting in separate windows.
echo Close those windows to stop the services.
echo.
pause
