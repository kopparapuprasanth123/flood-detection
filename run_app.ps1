# FloodGuard AI PowerShell Launcher
$env:Path = "$env:LOCALAPPDATA\Programs\Python\Python313;$env:LOCALAPPDATA\Programs\Python\Python313\Scripts;$env:LOCALAPPDATA\Programs\nodejs;" + $env:Path

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "      FloodGuard AI - Launching Full Stack Services     " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

Write-Host "`n[1/3] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = '$env:LOCALAPPDATA\Programs\Python\Python313;$env:LOCALAPPDATA\Programs\Python\Python313\Scripts;' + `$env:Path; cd '$backendPath'; py -3.13 -m uvicorn main:app --reload --port 8000"

Start-Sleep -Seconds 3

Write-Host "[2/3] Starting React Vite Frontend on http://localhost:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "`$env:Path = '$env:LOCALAPPDATA\Programs\nodejs;' + `$env:Path; cd '$frontendPath'; npm.cmd run dev"

Start-Sleep -Seconds 3

Write-Host "[3/3] Opening Web Dashboard in Browser..." -ForegroundColor Green
Start-Process "http://localhost:5173"
Start-Process "http://localhost:8000/docs"

Write-Host "`nBoth services are running!" -ForegroundColor Green
Write-Host "• Frontend:     http://localhost:5173" -ForegroundColor White
Write-Host "• Swagger Docs: http://localhost:8000/docs" -ForegroundColor White
