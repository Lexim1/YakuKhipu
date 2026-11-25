# Inicia el PostgreSQL portátil local (sin instalador ni permisos de administrador).
# Uso desde la raíz: powershell -ExecutionPolicy Bypass -File infra\local\iniciar_postgres.ps1 (agrega -Detener para apagarlo)
# Binarios: %LOCALAPPDATA%\YakuKhipu\pgsql · Datos: %LOCALAPPDATA%\YakuKhipu\pgdata (fuera del repositorio).
param([switch]$Detener)

$raiz = Join-Path $env:LOCALAPPDATA "YakuKhipu"
$bin = Join-Path $raiz "pgsql\bin"
$datos = Join-Path $raiz "pgdata"
$registro = Join-Path $raiz "postgres.log"

if (-not (Test-Path (Join-Path $bin "pg_ctl.exe"))) {
    Write-Output "No encuentro PostgreSQL en $bin. Descarga los binarios de Windows x64 desde enterprisedb.com/download-postgresql-binaries y descomprímelos en $raiz."
    exit 1
}
if ($Detener) {
    & (Join-Path $bin "pg_ctl.exe") -D $datos -m fast stop
    exit $LASTEXITCODE
}
& (Join-Path $bin "pg_ctl.exe") -D $datos status *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Output "PostgreSQL ya está en ejecución (localhost:5432)."
    exit 0
}
Start-Process -WindowStyle Hidden -FilePath (Join-Path $bin "pg_ctl.exe") -ArgumentList @("-D", "`"$datos`"", "-l", "`"$registro`"", "start")
Start-Sleep -Seconds 3
& (Join-Path $bin "pg_ctl.exe") -D $datos status
