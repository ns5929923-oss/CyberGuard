@echo off
title CyberGuard - Installation
echo ============================================
echo   CyberGuard Installation
echo ============================================
echo.

echo [1/4] Installing Python dependencies...
cd /d "%~dp0backend"
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Python dependency installation failed.
    echo Make sure Python and pip are installed.
    pause
    exit /b 1
)
echo  Done.
echo.

echo [2/4] Setting up backend environment...
if not exist .env (
    copy .env.example .env
    echo   Created backend .env from template
    echo   IMPORTANT: Edit CyberGuard\backend\.env and set strong secret keys!
) else (
    echo   backend .env already exists - skipped
)
echo  Done.
echo.

echo [3/4] Installing frontend dependencies...
cd /d "%~dp0frontend"
npm install
if errorlevel 1 (
    echo ERROR: npm install failed.
    echo Make sure Node.js and npm are installed.
    pause
    exit /b 1
)
echo  Done.
echo.

echo [4/4] Setting up frontend environment...
if not exist .env (
    copy .env.example .env
    echo   Created frontend .env from template
) else (
    echo   frontend .env already exists - skipped
)
echo  Done.
echo.

echo ============================================
echo   Installation complete!
echo.
echo   Next steps:
echo   1. Edit CyberGuard\backend\.env with your secret keys
echo   2. Run start-all.bat to launch CyberGuard
echo   3. Open http://localhost:5173 in your browser
echo ============================================
echo.
pause
