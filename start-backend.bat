@echo off
title CyberGuard Backend
cd /d "%~dp0backend"
if not exist .env (
    copy .env.example .env
    echo Created .env from template
)
echo Starting CyberGuard Backend on http://localhost:5000
echo Press Ctrl+C to stop.
echo.
python run.py
pause
