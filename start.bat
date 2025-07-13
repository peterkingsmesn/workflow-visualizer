@echo off
chcp 65001 > nul
echo Starting Workflow Visualizer...

cd /d "%~dp0"

echo Installing dependencies if needed...
call npm install

echo Starting servers...
start /B node server/index.js
timeout /t 3
call npx vite

pause