@echo off
title FloodGuard AI Runner
echo ========================================================
echo       FloodGuard AI - Launching Full Stack App
echo ========================================================
echo.

set "PATH=%LOCALAPPDATA%\Programs\Python\Python313;%LOCALAPPDATA%\Programs\Python\Python313\Scripts;%LOCALAPPDATA%\Programs\nodejs;%PATH%"

echo Starting FastAPI Backend (Port 8000)...
start "FloodGuard Backend" cmd /k "cd backend && py -3.13 -m uvicorn main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo Starting React Vite Frontend (Port 5173)...
start "FloodGuard Frontend" cmd /k "cd frontend && npm.cmd run dev"

timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173
start http://localhost:8000/docs

echo.
echo Both services are now running!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs
echo ========================================================
pause
