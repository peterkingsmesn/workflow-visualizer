@echo off
title Workflow Visualizer - Manager
color 0A
echo.
echo ========================================
echo   WORKFLOW VISUALIZER MANAGER
echo ========================================
echo.

:main_menu
echo Select an option:
echo.
echo  1. Install Dependencies
echo  2. Start Development Mode
echo  3. Start Production Mode
echo  4. Build Project
echo  5. Run Type Check
echo  6. View Project Info
echo  7. Exit
echo.
set /p choice=Enter your choice (1-7): 

if "%choice%"=="1" goto install_deps
if "%choice%"=="2" goto start_dev
if "%choice%"=="3" goto start_prod
if "%choice%"=="4" goto build_project
if "%choice%"=="5" goto type_check
if "%choice%"=="6" goto project_info
if "%choice%"=="7" goto exit_program

echo Invalid choice. Please try again.
echo.
goto main_menu

:install_deps
echo.
echo ========================================
echo   INSTALLING DEPENDENCIES
echo ========================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js from https://nodejs.org/
    pause
    goto main_menu
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm not found. Please install npm.
    pause
    goto main_menu
)

echo Node.js version:
node --version
echo npm version:
npm --version
echo.

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    goto main_menu
)

echo.
echo SUCCESS: Dependencies installed successfully!
pause
goto main_menu

:start_dev
echo.
echo ========================================
echo   STARTING DEVELOPMENT MODE
echo ========================================
echo.

if not exist "node_modules" (
    echo Dependencies not found. Installing...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        goto main_menu
    )
)

echo Starting development servers...
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo.
echo Press Ctrl+C to stop servers
echo.

echo Starting backend server...
start /B npm run server

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo Starting frontend server...
call npm run dev

echo Servers stopped.
pause
goto main_menu

:start_prod
echo.
echo ========================================
echo   STARTING PRODUCTION MODE
echo ========================================
echo.

if not exist "node_modules" (
    echo Dependencies not found. Installing...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        goto main_menu
    )
)

if not exist "dist" (
    echo Build not found. Building project...
    call npm run build
    if %errorlevel% neq 0 (
        echo ERROR: Build failed
        pause
        goto main_menu
    )
)

echo Starting production server...
echo Server URL: http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo.

node server/index.js
pause
goto main_menu

:build_project
echo.
echo ========================================
echo   BUILDING PROJECT
echo ========================================
echo.

if not exist "node_modules" (
    echo Dependencies not found. Installing...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        goto main_menu
    )
)

echo Running TypeScript type check...
call npx tsc --noEmit
if %errorlevel% neq 0 (
    echo ERROR: Type checking failed
    pause
    goto main_menu
)

echo Building application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    goto main_menu
)

echo.
echo SUCCESS: Build completed successfully!
echo Output directory: dist/
pause
goto main_menu

:type_check
echo.
echo ========================================
echo   TYPE CHECKING
echo ========================================
echo.

if not exist "node_modules" (
    echo Dependencies not found. Installing...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        goto main_menu
    )
)

echo Running TypeScript type check...
call npx tsc --noEmit
if %errorlevel% neq 0 (
    echo Type checking completed with errors (see above)
) else (
    echo SUCCESS: No type errors found!
)

pause
goto main_menu

:project_info
echo.
echo ========================================
echo   PROJECT INFORMATION
echo ========================================
echo.

echo Project: Workflow Visualizer
echo Location: %CD%
echo.

if exist "package.json" (
    echo Package.json found
) else (
    echo ERROR: package.json not found
)

if exist "node_modules" (
    echo Dependencies: Installed
) else (
    echo Dependencies: Not installed
)

if exist "dist" (
    echo Build: Available
) else (
    echo Build: Not available
)

if exist "src" (
    echo Source: Available
) else (
    echo Source: Not found
)

if exist "server" (
    echo Server: Available
) else (
    echo Server: Not found
)

echo.
echo Available scripts:
if exist "package.json" (
    findstr /C:"scripts" package.json >nul 2>nul
    if %errorlevel% equ 0 (
        echo - npm run dev
        echo - npm run build
        echo - npm run server
        echo - npm run lint
    )
)

pause
goto main_menu

:exit_program
echo.
echo Thank you for using Workflow Visualizer Manager!
echo.
exit /b 0