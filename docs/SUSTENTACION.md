# Guia de sustentacion - Proyecto 7

Tiempo máximo: 20 minutos. Como son cuatro integrantes, cada uno debe hablar 5 minutos.

La division detallada esta en `docs/GUION_SUSTENTACION_20_MIN.md`.

## Distribucion por integrante

1. Luis Felipe Murillo Matallana - 0:00 a 5:00
   - Problema.
   - Objetivo.
   - Contexto.
   - Alternativas de solución.
   - Entregables.

2. Juan Sebastián Delgado - 5:00 a 10:00
   - Arquitectura general.
   - Docker Compose.
   - Imagen Zabbix personalizada y volumenes.
   - Inventario web, DB, DNS y FTP.
   - Agentes Zabbix.

3. Daniela Castro Quiñones - 10:00 a 15:00
   - Zabbix Server con PostgreSQL.
   - Zabbix Web.
   - Aprovisionamiento por API.
   - CPU, memoria, disco y latest data.
   - Mostrar el `Centro de gráficas` con CPU, memoria, disco, rutas y cargas recientes.
   - MailHog como receptor de alertas.

4. Juan Camilo Ballesteros Sierra - 15:00 a 20:00
   - Pruebas minimas.
   - Ejecutar `artillery run tests/artillery-live-demo.yml` con el panel `Load Lab en vivo` abierto.
   - Simular caída de `web-service`.
   - Mostrar el web scenario `Proyecto 7 - recorrido público` en Zabbix.
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

- Luis Felipe Murillo Matallana: problema, objetivo, contexto y entregables.
- Juan Sebastián Delgado: arquitectura, Docker Compose, inventario y agentes.
- Daniela Castro Quiñones: Zabbix configurado, dashboard, latest data y alertas.
- Juan Camilo Ballesteros Sierra: pruebas en vivo, Artillery, caída, MailHog, auditoria y cierre.
