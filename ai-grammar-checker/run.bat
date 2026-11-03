@echo off
title AI Grammar Checker - Setup & Launcher
echo ========================================================
echo        AI Grammar Checker - Local Windows Launcher
echo ========================================================
echo.

:: Check for py or python launcher
where py >nul 2>nul
if %errorlevel% equ 0 (
    set PYTHON_CMD=py
    goto :INSTALL_DEPS
)

where python >nul 2>nul
if %errorlevel% equ 0 (
    set PYTHON_CMD=python
    goto :INSTALL_DEPS
)

echo [ERROR] Python was not found in your PATH or via 'py' launcher.
echo Please install Python 3.9+ from https://www.python.org/downloads/
pause
exit /b 1

:INSTALL_DEPS
echo [1/3] Using Python launcher: %PYTHON_CMD%
echo [2/3] Installing/verifying dependencies from requirements.txt...
%PYTHON_CMD% -m pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo [WARNING] Pip install had warnings or errors. Attempting to continue...
)

echo [3/3] Starting AI Grammar Checker Web Server...
echo.
echo Application URL: http://127.0.0.1:5000
echo Press CTRL+C in this window to stop the server.
echo.

:: Open browser after 2 seconds in background
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:5000"

:: Start Flask app
%PYTHON_CMD% app.py
pause
