param(
    [Parameter(Mandatory=$false)]
    [string]$Password = "",

    [Parameter(Mandatory=$false)]
    [string]$Port = "5432",

    [Parameter(Mandatory=$false)]
    [string]$User = "postgres",

    [Parameter(Mandatory=$false)]
    [string]$Database = "postgres"
)

$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $psqlPath)) {
    Write-Error "psql.exe tidak ditemukan di $psqlPath"
    exit 1
}

if (-not $Password) {
    $Password = Read-Host "Masukkan password user '$User' untuk PostgreSQL 18 lokal" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
    $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

$env:PGPASSWORD = $Password

Write-Host "Menginisialisasi Skema Builder Low-Code ke PostgreSQL 18 lokal ($Port/$Database)..." -ForegroundColor Cyan

$builderSql = "$PSScriptRoot\deploy\sql\024_builder_schema.sql"
& $psqlPath -h 127.0.0.1 -p $Port -U $User -d $Database -f $builderSql

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Skema Builder Low-Code berhasil terpasang di PostgreSQL 18 lokal!" -ForegroundColor Green
    
    # Buat file .env lokal otomatis
    $envContent = @"
PORT=8085
DATABASE_URL=postgres://${User}:${Password}@127.0.0.1:${Port}/${Database}?sslmode=disable
JWT_SECRET=super-secret-jwt-token-with-at-least-32-bytes-long
"@
    Set-Content -Path "$PSScriptRoot\.env" -Value $envContent
    Write-Host "[OK] File .env lokal telah diperbarui dengan kredensial PostgreSQL 18." -ForegroundColor Green
} else {
    Write-Error "Gagal mengaplikasikan skema. Pastikan password benar."
}
