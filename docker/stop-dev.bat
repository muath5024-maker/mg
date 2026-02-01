@echo off
REM ============================================
REM MBUY Development Environment - Stop Script
REM ============================================

echo.
echo Stopping MBUY Development Environment...
echo.

cd /d "%~dp0"

docker-compose -f docker-compose.dev.yml down

echo.
echo All services stopped successfully!
echo.

pause
