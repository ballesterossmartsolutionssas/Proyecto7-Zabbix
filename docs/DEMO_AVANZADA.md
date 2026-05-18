# Demo avanzada - Proyecto 7

Esta demo muestra valor agregado sobre el requerimiento base: monitoreo sintetico HTTP, backend transaccional, pruebas de carga, SLO de laboratorio y paquete de evidencias.

## Flujo recomendado

1. Abrir el portal publico:

   ```text
   https://web-zabbix.negociocontigo.com
   ```

2. Mostrar que el frontend consulta backend real:

   - Estado HTTP `/health`.
   - Conexion MariaDB.
   - Incidentes persistidos.
   - SLO runtime.

3. Abrir endpoints verificables:

   ```text
   https://web-zabbix.negociocontigo.com/api/db/status
   https://web-zabbix.negociocontigo.com/api/slo
   https://web-zabbix.negociocontigo.com/metrics
   ```

4. Ejecutar carga:

   ```bash
   npx artillery run tests/artillery-smoke.yml
   ```

5. En Zabbix mostrar:

   - Host `web-host`.
   - Item `Exporter /metrics Proyecto 7`.
   - Item `Estado MariaDB desde API Proyecto 7`.
   - Web scenario `Proyecto 7 - recorrido publico`.
   - Problemas y recuperaciones al detener `web-service`.

6. Generar evidencias:

   ```bash
   cd /root/proyecto7-zabbix
   bash scripts/evidence-pack.sh
   ```

## Argumento tecnico

El proyecto no se limita a revisar puertos abiertos. La plataforma monitorea una aplicacion con frontend, backend, persistencia en MariaDB y endpoints de telemetria. Artillery genera trafico y escrituras reales, mientras Zabbix observa disponibilidad, latencia HTTPS publica, exporter de metricas, estado de DB y recorrido sintetico HTTP.

## Evidencias esperadas

- `summary.json`: version, uptime y contadores.
- `db-status.json`: conexion, filas persistidas e incidentes.
- `slo.json`: disponibilidad calculada del proceso.
- `metrics.prom`: metricas estilo Prometheus.
- `artillery-smoke.txt`: resultado de prueba de carga.
- `zabbix-items.json`: ultimos valores recibidos por Zabbix.
