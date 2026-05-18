Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "Validando sintaxis de docker-compose.yml..."
docker compose config --quiet

Write-Host "Validando sintaxis de docker-compose.vps.yml..."
docker compose -f docker-compose.vps.yml config --quiet

Write-Host "Validando backend Node.js..."
node --check .\services\web\server.js

Write-Host "Servicios definidos:"
docker compose config --services

Write-Host ""
Write-Host "Para iniciar todo:"
Write-Host "  .\scripts\provision.ps1"
