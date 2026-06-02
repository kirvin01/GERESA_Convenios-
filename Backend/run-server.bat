@echo off
cd /d "%~dp0"
echo Iniciando API con venv: %~dp0venv\Scripts\python.exe
"%~dp0venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0
