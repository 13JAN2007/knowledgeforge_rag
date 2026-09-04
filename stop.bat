@echo off
title KnowledgeForge AI Stopper
echo ====================================================
echo        Stopping KnowledgeForge AI Services
echo ====================================================
echo.

cd /d "%~dp0"

echo Stopping Docker containers...
docker compose stop

echo Stopping running Node and Python uvicorn processes...
taskkill /FI "WINDOWTITLE eq KnowledgeForge - Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq KnowledgeForge - Frontend*" /T /F >nul 2>&1

echo.
echo [OK] All services stopped.
pause
exit /b 0
