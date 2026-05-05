Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "Levantando stack Docker..."
docker compose up -d

Write-Host "Esperando y configurando Zabbix via API..."
python .\scripts\provision_zabbix.py

Write-Host ""
Write-Host "Accesos:"
Write-Host "  Zabbix  http://localhost:8088  Admin / zabbix"
Write-Host "  MailHog http://localhost:8025"
