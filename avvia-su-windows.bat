@echo off
REM Prova BLACKBLADE sul PC Windows (serve Python installato)
cd /d "%~dp0"
start "" http://127.0.0.1:8765/
python tools\server.py 8765
