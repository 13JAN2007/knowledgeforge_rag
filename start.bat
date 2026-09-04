@echo off
title KnowledgeForge AI Launcher
echo ====================================================
echo        Starting KnowledgeForge AI
echo ====================================================
echo.

:: Move to script directory
cd /d "%~dp0"

:: 1. Start Docker services (PostgreSQL + Qdrant)
echo [1/3] Starting Docker database containers (PostgreSQL & Qdrant)...
docker compose up -d
if errorlevel 1 (
    echo [WARNING] Docker failed to start. Make sure Docker Desktop is open.
)

:: 2. Launch Backend FastAPI server in a dedicated window
echo [2/3] Launching FastAPI Backend on http://localhost:8000...
start "KnowledgeForge - Backend" cmd /k "cd /d "%~dp0backend" && .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

:: 3. Launch Frontend Vite server in a dedicated window
echo [3/3] Launching React Frontend...
start "KnowledgeForge - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ====================================================
echo   KnowledgeForge AI is starting!
echo   - Backend:  http://localhost:8000
echo   - Frontend: http://localhost:5173 (or 5174)
echo   - Qdrant:   http://localhost:6333/dashboard
echo ====================================================
echo.
echo Waiting a few seconds before opening the browser...
timeout /t 4 /nobreak >nul
start http://localhost:5173

exit /b 0
