# Guia de sustentacion - Proyecto 7

Tiempo maximo: 20 minutos. Como son cuatro integrantes, cada uno debe hablar 5 minutos.

La division detallada esta en `docs/GUION_SUSTENTACION_20_MIN.md`.

## Distribucion por integrante

1. Juan Camilo Ballesteros Sierra - 0:00 a 5:00
   - Problema.
   - Objetivo.
   - Arquitectura general.
   - Docker Compose.
   - Imagen Zabbix personalizada y volumenes.

2. Luis Felipe Murillo Matallana - 5:00 a 10:00
   - Zabbix Server con PostgreSQL.
   - Zabbix Web para visualizacion.
   - Script `scripts/provision_zabbix.py`.
   - Hosts, grupos, templates, triggers y dashboard.
   - Backend web y MariaDB.

3. Juan Sebastian Delgado - 10:00 a 15:00
   - Hosts monitoreados: web, DB, DNS y FTP.
   - Agentes Zabbix.
   - Checks HTTP, MySQL, DNS, FTP y ping.
   - CPU, memoria, disco y latest data.
   - Mostrar el `Centro de graficas` con CPU, memoria, disco, rutas y cargas recientes.

4. Daniela Castro Quinones - 15:00 a 20:00
   - Pruebas minimas.
   - Ejecutar `artillery run tests/artillery-live-demo.yml` con el panel `Load Lab en vivo` abierto.
   - Simular caida de `web-service`.
   - Mostrar el web scenario `Proyecto 7 - recorrido publico` en Zabbix.
   - Ver problema en Zabbix.
   - Ver correo en MailHog.
   - Restaurar servicio y mostrar recuperacion.
   - Mostrar la `Matriz de cumplimiento` y auditoria.

## Cierre comun

Si queda tiempo, usar los ultimos 30 segundos para cerrar con:

   - Zabbix centraliza visibilidad operativa.
   - Triggers permiten reaccionar ante fallas.
   - MailHog valida el flujo de alertas y el canal SMTP real demuestra escalamiento externo.
   - La app monitoreada tiene backend, frontend, persistencia e endpoints de carga para pruebas de estres.
   - El SLO, la matriz de cumplimiento y el paquete de evidencias permiten explicar disponibilidad y resultados de forma verificable.
   - Docker Compose hace reproducible el despliegue.

## Reparto por integrante

- Juan Camilo Ballesteros Sierra: arquitectura general y Docker Compose.
- Luis Felipe Murillo Matallana: configuracion de Zabbix Server, frontend y base de datos.
- Juan Sebastian Delgado: hosts monitoreados, agentes y checks.
- Daniela Castro Quinones: pruebas, alertas MailHog y documentacion.
