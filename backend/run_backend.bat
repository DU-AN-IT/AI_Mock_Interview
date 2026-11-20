@echo off
cd /d "%~dp0"

if not exist ".venv\Scripts\activate.bat" (
    echo Virtual environment not found. Run setup_backend.bat first.
    pause
    exit /b 1
)

call ".venv\Scripts\activate.bat"
echo Starting AI Mock Interview API at http://127.0.0.1:8000
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
