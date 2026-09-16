@echo off
title Thanishka Beauty Parlour - Website
cd /d "%~dp0"

echo.
echo ============================================
echo   THANISHKA BEAUTY PARLOUR WEBSITE
echo ============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo Node.js is not installed on this computer.
    echo.
    echo Please install Node.js LTS from:
    echo https://nodejs.org/
    echo.
    echo After installing Node.js, double-click this file again.
    echo.
    pause
    exit /b 1
)

echo Starting the website...
start "" /b node server.js

timeout /t 2 /nobreak >nul

echo Opening the website in your browser...
start "" "http://localhost:3000"

echo.
echo Website is running at:
echo http://localhost:3000
echo.
echo IMPORTANT: Keep this window open while using the website.
echo Close this window when you are finished.
echo.
pause
