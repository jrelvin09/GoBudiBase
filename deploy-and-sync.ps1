param(
    [Parameter(Mandatory=$false)]
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " GOBUDIBASE AUTO-SYNC: LOCAL -> SERVER 106 -> GITHUB      " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot
$serverIP = "10.10.1.106"
$sshKey = "C:\Users\Mukti\.ssh\id_rsa"

# 1. BUILD FRONTEND SVELTEKIT STATIC SPA
Write-Host "`n[1/5] Building Frontend SvelteKit Static SPA..." -ForegroundColor Yellow
Set-Location "$root\web-svelte"
npm run build
if ($LASTEXITCODE -ne 0) { throw "Gagal build frontend SvelteKit" }

# 2. CROSS-COMPILE GO NATIVE BACKEND UNTUK LINUX AMD64 & WINDOWS
Write-Host "`n[2/5] Compiling Go Native Daemon (Windows & Linux AMD64)..." -ForegroundColor Yellow
Set-Location "$root"
# Windows local binary
go build -o bin/server.exe cmd/server/main.go
# Linux AMD64 server binary
$env:GOOS = "linux"
$env:GOARCH = "amd64"
go build -ldflags="-s -w" -o bin/gobudibase cmd/server/main.go
Remove-Item Env:\GOOS, Env:\GOARCH

# 3. DEPLOY BINARY KE SERVER 10.10.1.106
Write-Host "`n[3/5] Deploying Go Daemon ke Server $serverIP..." -ForegroundColor Yellow
tar -czf "$root\bin\gobudibase.tar.gz" -C "$root\bin" gobudibase
scp -i $sshKey -o StrictHostKeyChecking=no "$root\bin\gobudibase.tar.gz" "mukti@${serverIP}:/tmp/gobudibase.tar.gz"
ssh -i $sshKey -o StrictHostKeyChecking=no "mukti@${serverIP}" "sudo systemctl stop gobudibase && sudo tar -xzf /tmp/gobudibase.tar.gz -C /usr/local/bin/ && sudo chmod +x /usr/local/bin/gobudibase && sudo systemctl start gobudibase"

# 4. DEPLOY FRONTEND SPA KE /var/www/gobudibase/ DI SERVER
Write-Host "`n[4/5] Deploying Static SPA ke /var/www/gobudibase/ di Server $serverIP..." -ForegroundColor Yellow
tar -czf "$root\build.tar.gz" -C "$root\web-svelte\build" .
scp -i $sshKey -o StrictHostKeyChecking=no "$root\build.tar.gz" "mukti@${serverIP}:/tmp/gobudibase_build.tar.gz"
ssh -i $sshKey -o StrictHostKeyChecking=no "mukti@${serverIP}" "sudo tar -xzf /tmp/gobudibase_build.tar.gz -C /var/www/gobudibase && sudo chown -R www-data:www-data /var/www/gobudibase"

# Verifikasi Live Server Health
$health = ssh -i $sshKey -o StrictHostKeyChecking=no "mukti@${serverIP}" "curl -k -s -I https://${serverIP}/gobudibase/ | head -n 1 && systemctl status gobudibase | grep -E 'Active:|Memory:'"
Write-Host "[OK] Server 106 Status: $health" -ForegroundColor Green

# 5. COMMIT & PUSH KE GITHUB (c & p -> gh)
Write-Host "`n[5/5] Git Commit & Push ke GitHub (jrelvin09/GoBudiBase)..." -ForegroundColor Yellow
Set-Location "$root"
git add .
$status = git status --porcelain
if ($status) {
    if (-not $Message) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
        $Message = "feat: update dev sync ($timestamp)"
    }
    git commit -m "$Message"
    git push origin main
    Write-Host "[OK] Berhasil Commit & Push ke GitHub!" -ForegroundColor Green
} else {
    Write-Host "[INFO] Tidak ada perubahan file baru untuk di-commit." -ForegroundColor Cyan
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " SINKRONISASI SELESAI & LIVE 100%!" -ForegroundColor Green
Write-Host " - Live Server 106: https://${serverIP}/" -ForegroundColor Green
Write-Host " - GitHub Repo:     https://github.com/jrelvin09/GoBudiBase" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
