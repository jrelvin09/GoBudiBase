# ============================================================================
# GoBudiBase Local Development Runner (Windows PowerShell)
# ============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Memulai GoBudiBase Enterprise di Komputer Lokal..." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Cek / Aktifkan SSH Port Forwarding ke Database PostgreSQL 17 (Port 54322)
$tunnelActive = $false
try {
    $tcp = Test-NetConnection -ComputerName 127.0.0.1 -Port 54322 -WarningAction SilentlyContinue
    $tunnelActive = $tcp.TcpTestSucceeded
} catch {
    $tunnelActive = $false
}

if (-not $tunnelActive) {
    Write-Host "[1/3] Menghubungkan tunnel aman ke PostgreSQL 17 server 10.10.1.106:54322..." -ForegroundColor Yellow
    Start-Process -FilePath "ssh" -ArgumentList "-i", "C:\Users\Mukti\.ssh\id_rsa", "-o", "StrictHostKeyChecking=no", "-L", "54322:127.0.0.1:54322", "mukti@10.10.1.106", "-N" -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Host "[1/3] Database PostgreSQL 17 lokal (port 54322) terdeteksi aktif." -ForegroundColor Green
}

# 2. Jalankan Backend Go Native (Port 8085)
Write-Host "[2/3] Menjalankan Backend Daemon Go Native (port 8085)..." -ForegroundColor Yellow
$goProcess = Start-Process -FilePath "$PSScriptRoot\bin\server.exe" -PassThru -WindowStyle Normal

# 3. Jalankan Frontend SvelteKit dengan Vite Hot Module Reloading (HMR)
Write-Host "[3/3] Menjalankan Frontend SvelteKit 2 Studio & Runtime (HMR)..." -ForegroundColor Yellow
Write-Host ""
Write-Host ">> Akses Aplikasi Lokal di Browser: http://localhost:5173" -ForegroundColor Cyan
Write-Host ">> Backend Go API Lokal:            http://127.0.0.1:8085" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tekan Ctrl+C di terminal ini untuk berhenti." -ForegroundColor DarkGray

Set-Location "$PSScriptRoot\web-svelte"
npm run dev
