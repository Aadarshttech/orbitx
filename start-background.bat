@echo off
title X-Autopilot 24/7 Daemon
cd /d "%~dp0"
echo ========================================================
echo   🐦 X-AUTOPILOT 24/7 AUTOMATED POSTING DAEMON
echo   5 Posts/Day Campaign Engine (@AadarshP77)
echo ========================================================
echo.
echo Starting scheduler with auto-restart protection...
echo Keep this window minimized if you want to monitor logs.
echo.

:loop
node src/index.js start
echo.
echo [!] Scheduler exited at %date% %time%. Restarting automatically in 5 seconds...
timeout /t 5 /nobreak >nul
goto loop
