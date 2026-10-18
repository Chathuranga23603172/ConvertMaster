@echo off
title ConvertMaster Backend Server
echo ========================================================
echo Starting ConvertMaster Python FastAPI Backend on port 8000
echo ========================================================
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
) else (
    echo [ERROR] Virtual environment not found in .venv!
    echo Run: python -m venv .venv ^&^& .venv\Scripts\pip install -r requirements.txt
    pause
)
