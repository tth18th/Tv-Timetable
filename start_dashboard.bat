@echo off
echo Starting Prayer Times Dashboard...
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed!
    echo Please install Python 3.x from: https://www.python.org/downloads/
    pause
    exit /b 1
)

:: Kill existing server on port 8000
echo 📊 Checking for existing server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo Killing process PID %%a...
    taskkill /F /PID %%a >nul 2>&1
    timeout /t 2 >nul
)

:: Create required folders
if not exist "data" (
    echo ⚠️  Data folder not found. Creating 'data' folder...
    mkdir data
    echo.
    echo =========================================
    echo 📁 IMPORTANT: Add your prayer time files
    echo =========================================
    echo 1. Place JSON files in the 'data' folder
    echo 2. Format: jamaah_times_YYYY_MM.json
    echo 3. Example: jamaah_times_2024_12.json
    echo.
    echo The dashboard will start with fallback data.
    echo You can add your files while server is running.
    echo =========================================
    echo.
    timeout /t 5 >nul
)

if not exist "images" (
    echo 🖼️  Creating 'images' folder...
    mkdir images
    echo Add images to this folder for slideshow
)

:: Run Python server
echo 🚀 Starting server on http://localhost:8000...
echo.
python "%~dp0run_server.py"

pause
