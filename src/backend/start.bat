@echo off
REM TuneTools Backend Startup Script (Windows)
REM This script starts the FastAPI backend server

echo ==========================================
echo   TuneTools Backend - Starting Server
echo ==========================================

REM Check if .env file exists
if not exist .env (
    echo ❌ Error: .env file not found!
    echo Please copy .env.example to .env and configure it.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist .venv (
    if not exist venv (
        echo ⚠️  Warning: Virtual environment not found.
        echo Creating virtual environment...
        python -m venv .venv
        echo ✅ Virtual environment created.
    )
)

REM Activate virtual environment
if exist .venv\Scripts\activate.bat (
    echo 🔧 Activating virtual environment (.venv^)...
    call .venv\Scripts\activate.bat
) else if exist venv\Scripts\activate.bat (
    echo 🔧 Activating virtual environment (venv^)...
    call venv\Scripts\activate.bat
)

REM Check if requirements are installed
echo 📦 Checking dependencies...
pip install -q -r requirements.txt

REM Get port from environment or use default
if "%PORT%"=="" set PORT=8000

echo.
echo ✅ Starting TuneTools backend on port %PORT%...
echo 📍 API Documentation: http://localhost:%PORT%/docs
echo 📍 Health Check: http://localhost:%PORT%/health
echo.
echo Press Ctrl+C to stop the server
echo ==========================================

REM Start the server
uvicorn main:app --host 0.0.0.0 --port %PORT% --reload
