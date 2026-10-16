@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "step.ps1"
pause
