@echo off
REM ============================================
REM MBUY Development Environment - Start Script (Windows)
REM ============================================

echo.
echo ============================================
echo   MBUY Development Environment
echo ============================================
echo.

REM التحقق من وجود Docker
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not installed or not in PATH
    echo Please install Docker Desktop for Windows
    pause
    exit /b 1
)

echo [INFO] Starting Docker Compose services...
echo.

cd /d "%~dp0"

docker-compose -f docker-compose.dev.yml up -d

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start services
    pause
    exit /b 1
)

echo.
echo [INFO] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ============================================
echo   Services Ready!
echo ============================================
echo.
echo   Worker API:      http://localhost:8787
echo   Adminer:         http://localhost:8080
echo   MinIO Console:   http://localhost:9001
echo   AnythingLLM:     http://localhost:3001
echo   n8n:             http://localhost:5678
echo.
echo ============================================
echo   Database Info
echo ============================================
echo   Host: localhost
echo   Port: 5432
echo   User: postgres
echo   Pass: postgres123
echo   DB:   mbuy_dev
echo.
echo ============================================
echo.
echo To view logs:   docker-compose -f docker-compose.dev.yml logs -f
echo To stop all:    docker-compose -f docker-compose.dev.yml down
echo.

pause
