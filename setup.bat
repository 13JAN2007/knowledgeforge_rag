@echo off
echo ====================================================
echo   KnowledgeForge AI - Complete Setup Script
echo ====================================================
echo.

REM --- Check Python ---
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.11+ from https://python.org
    pause
    exit /b 1
)
echo [OK] Python found.

REM --- Check Node.js ---
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found.

REM --- Backend setup ---
echo.
echo [1/4] Setting up Python backend...
cd backend
if not exist .venv (
    python -m venv .venv
    echo [OK] Virtual environment created.
)
call .venv\Scripts\activate
pip install -r requirements.txt --quiet
echo [OK] Python packages installed.

REM --- Copy .env if not exists ---
if not exist .env (
    copy ..\\.env.example .env
    echo [OK] .env file created from template.
    echo [ACTION NEEDED] Open backend\.env and add your GEMINI_API_KEY
)
cd ..

REM --- Frontend setup ---
echo.
echo [2/4] Installing frontend dependencies...
cd frontend
call npm install --silent
echo [OK] npm packages installed.
cd ..

REM --- Docker check ---
echo.
echo [3/4] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Docker not found. PostgreSQL and Qdrant won't start automatically.
    echo Install Docker Desktop from https://docker.com and run: docker-compose up -d
) else (
    echo [OK] Docker found. Starting PostgreSQL and Qdrant...
    docker-compose up -d
    echo [OK] Databases starting in background.
)

echo.
echo ====================================================
echo   Setup Complete!
echo ====================================================
echo.
echo Next steps:
echo.
echo 1. Add your Gemini API key to backend\.env:
echo    GEMINI_API_KEY=your-key-here
echo.
echo 2. Run database migrations:
echo    cd backend
echo    .venv\Scripts\activate
echo    alembic upgrade head
echo.
echo 3. Start the backend (in one terminal):
echo    cd backend
echo    .venv\Scripts\activate  
echo    uvicorn app.main:app --reload --port 8000
echo.
echo 4. Start the frontend (in another terminal):
echo    cd frontend
echo    npm run dev
echo.
echo Then open: http://localhost:5174
echo API docs:  http://localhost:8000/api/docs
echo.
pause
