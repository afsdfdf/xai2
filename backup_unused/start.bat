@echo off
title XAI Finance - Development Server

echo Starting XAI Finance Development Environment...
echo.

REM Create a virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate
)

echo.
echo Starting Python API server in a new window...
start cmd /k "title Python API Server && call venv\Scripts\activate && python api_server.py"

echo.
echo Waiting for API server to start...
timeout /t 5 /nobreak > nul

echo.
echo Starting Next.js app...
npm run dev

echo.
echo Servers are stopping...
exit 