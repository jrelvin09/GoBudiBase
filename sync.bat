@echo off
title GoBudiBase Deploy to 106 and Sync to GitHub
cls
echo ==========================================================
echo  GoBudiBase: Deploy ke Server 106 & Push ke GitHub
echo ==========================================================
set /p msg="Masukkan pesan commit (kosongkan untuk default): "
if "%msg%"=="" (
    powershell -ExecutionPolicy Bypass -File "%~dp0deploy-and-sync.ps1"
) else (
    powershell -ExecutionPolicy Bypass -File "%~dp0deploy-and-sync.ps1" -Message "%msg%"
)
pause
