# Plan de pruebas - Proyecto 7 Zabbix

## 1. Dashboard en tiempo real

Objetivo: evidenciar CPU, memoria, disco y estado de servicios.

Pasos:

1. Abrir Zabbix en `http://localhost:8088`.
2. Ingresar con `Admin / zabbix`.
3. Ir a `Monitoring > Hosts` y verificar los hosts:
   - `web-host`
   - `db-host`
   - `dns-host`
   - `ftp-host`
4. Abrir `Latest data` y filtrar por el grupo `Proyecto 7 - Infraestructura Docker`.
5. Tomar capturas de:
   - `agent.ping`
   - carga de CPU
   - memoria disponible
   - uso de disco
   - disponibilidad de HTTP, MySQL, DNS y FTP

Resultado esperado: los items actualizan datos cada 30 segundos.

## 2. Simulacion de caida de host o servicio

Objetivo: demostrar deteccion de falla.

Comando:

```powershell
.\scripts\test-failure.ps1 -Service web-service -Seconds 90
```

Resultado esperado:

- El trigger `HTTP web-service no responde` aparece en `Monitoring > Problems`.
- Al restaurar el contenedor, el problema cambia a resuelto.

Tambien se puede probar con:

```powershell
.\scripts\test-failure.ps1 -Service db-service -Seconds 90
.\scripts\test-failure.ps1 -Service dns-service -Seconds 90
.\scripts\test-failure.ps1 -Service ftp-service -Seconds 90
```

## 3. Envio de alertas a MailHog

Objetivo: comprobar notificaciones por correo.

Pasos:

1. Abrir MailHog en `http://localhost:8025`.
2. En Zabbix, configurar un media para el usuario Admin si no existe:
   - Type: `Email`
   - Send to: `admin@proyecto7.local`
   - Enabled: si
3. Crear o verificar una accion en `Alerts > Actions > Trigger actions`.
4. Ejecutar una caida con `test-failure.ps1`.
5. Confirmar que llega correo a MailHog.

Resultado esperado: MailHog muestra un correo de problema y luego uno de recuperacion.

## 4. Metricas historicas

Objetivo: explicar uso de graficas para analisis.

Pasos:

1. Dejar el stack activo 10 a 15 minutos.
2. Ir a `Monitoring > Latest data`.
3. Seleccionar un item y abrir `Graph`.
4. Generar carga simple:

```powershell
1..100 | ForEach-Object { Invoke-WebRequest -UseBasicParsing http://localhost:8088 > $null }
```

Resultado esperado: se observan puntos historicos y variaciones de las metricas.
