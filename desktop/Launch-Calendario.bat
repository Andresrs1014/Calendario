@echo off
setlocal EnableDelayedExpansion

cd /d "%~dp0"

echo Iniciando Calendario Ibero...

set "BACKEND=%~dp0..\backend"
set "FRONTEND=%~dp0..\frontend"

:: Start backend silently
start /min "" cmd /c "cd /d "%BACKEND%" && call venv\Scripts\activate && uvicorn main:app --reload >nul 2>&1"

:: Start frontend silently  
start /min "" cmd /c "cd /d "%FRONTEND%" && npm run dev >nul 2>&1"

:: Wait for services
timeout /t 6 /nobreak >nul

:: Start Electron
cd /d "%~dp0"
start "" npm run dev
