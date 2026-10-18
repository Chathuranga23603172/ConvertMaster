# ConvertMaster Backend Server Launcher for PowerShell
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Starting ConvertMaster Python FastAPI Backend on :8000 " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$VenvPython = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"

if (Test-Path $VenvPython) {
    & $VenvPython -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
} else {
    Write-Host "[ERROR] Virtual environment not found at $VenvPython" -ForegroundColor Red
    Write-Host "Run: py -m venv .venv; .\backend\.venv\Scripts\pip.exe install -r requirements.txt"
}
