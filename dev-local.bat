@echo off
title GoBudiBase Local Enterprise Platform
cls
echo ==========================================================
echo  Memulai GoBudiBase Enterprise di Komputer Lokal (Windows)
echo ==========================================================
powershell -ExecutionPolicy Bypass -File "%~dp0dev-local.ps1"
pause
