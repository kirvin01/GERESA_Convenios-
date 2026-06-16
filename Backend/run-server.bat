@echo off
cd /d "%~dp0"

echo Liberando puerto 8000 si esta ocupado...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo Finalizando PID %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo Iniciando API con venv: %~dp0venv\Scripts\python.exe
"%~dp0venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000
