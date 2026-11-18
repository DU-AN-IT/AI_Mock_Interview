@echo off
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo [1/3] Creating Python virtual environment...
    py -m venv .venv
    if errorlevel 1 goto error
)

call ".venv\Scripts\activate.bat"

echo [2/3] Installing Python packages...
python -m pip install --upgrade pip
if errorlevel 1 goto error
python -m pip install -r requirements.txt
if errorlevel 1 goto error

if not exist ".env" (
    echo [3/3] Creating .env from .env.example...
    copy ".env.example" ".env" >nul
) else (
    echo [3/3] Existing .env found; leaving it unchanged.
)

echo.
echo Setup completed. Edit backend\.env and add your Gemini API key.
pause
exit /b 0

:error
echo.
echo Setup failed. Check the error message above and your Python/pip installation.
pause
exit /b 1
