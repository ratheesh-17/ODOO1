@echo off
cd /d C:\Users\ttino\Travelloop\backend
C:\Users\ttino\AppData\Local\Python\bin\python3.exe -m uvicorn app.main:app --reload --port 8000
pause
