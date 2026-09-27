@echo off
title MikroTik Manager Launcher
cls
color 0B
echo ========================================================
echo               MIKROTIK MANAGER LAUNCHER                 
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Next.js Server on http://localhost:3000 ...
start "MikroTik Manager Server" cmd /k "npm run dev"

echo [2/2] Waiting for server initialization...
timeout /t 4 /nobreak >nul

echo Opening MikroTik Manager in Google Chrome...
start chrome "http://localhost:3000" 2>nul || start "" "http://localhost:3000"

echo.
echo ========================================================
echo  Server is running! App opened in browser.              
echo  URL: http://localhost:3000                             
echo ========================================================
echo.
pause
