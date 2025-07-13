@echo off
title Workflow Visualizer - Diagnostics
color 0B
echo.
echo ========================================
echo   Workflow Visualizer Diagnostics
echo ========================================
echo.

:: Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    where python3 >nul 2>nul
    if %errorlevel% neq 0 (
        echo ERROR: Python not found
        echo Please install Python from https://python.org/
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=python3
    )
) else (
    set PYTHON_CMD=python
)

echo Python: %PYTHON_CMD%
%PYTHON_CMD% --version
echo.

:: Check if diagnostic script exists
if not exist "simple_diagnose.py" (
    echo ERROR: simple_diagnose.py not found
    echo Please ensure the diagnostic script is in the current directory
    pause
    exit /b 1
)

echo Running project diagnostic...
echo.

:: Run diagnostic
%PYTHON_CMD% simple_diagnose.py

echo.
echo Diagnostic complete!
echo.
pause