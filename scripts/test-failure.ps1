param(
    [ValidateSet("web-service", "db-service", "dns-service", "ftp-service")]
    [string]$Service = "web-service",
    [int]$Seconds = 90
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "Deteniendo $Service para disparar alerta en Zabbix..."
docker compose stop $Service

Write-Host "Espera $Seconds segundos. Revisa Problems en Zabbix y MailHog."
Start-Sleep -Seconds $Seconds

Write-Host "Restaurando $Service..."
docker compose start $Service

Write-Host "Listo. La alerta debe cambiar a estado resuelto despues del siguiente ciclo de sondeo."

