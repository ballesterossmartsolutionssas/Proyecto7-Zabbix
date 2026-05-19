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
   - Centro de graficas con telemetria, cargas, rutas y SLO.
   - Matriz de cumplimiento con requisitos del enunciado y evidencia tecnica.

3. Abrir endpoints verificables:

   ```text
   https://web-zabbix.negociocontigo.com/api/db/status
   https://web-zabbix.negociocontigo.com/api/slo
   https://web-zabbix.negociocontigo.com/api/charts
   https://web-zabbix.negociocontigo.com/api/compliance
   https://web-zabbix.negociocontigo.com/metrics
   ```

4. Ejecutar carga:

   ```bash
   npx --yes artillery@2.0.20 run tests/artillery-smoke.yml
   ```

   Para mostrar carga en vivo con el panel del portal abierto:

   ```bash
   cd /root/proyecto7-zabbix
   npm install -g artillery@2.0.20
   artillery run tests/artillery-live-demo.yml
   ```

   Si se quiere evidenciar saturacion y degradacion, ejecutar el escenario opcional:

   ```bash
   artillery run tests/artillery-stress-demo.yml
   ```

   Para guardar snapshots antes y despues:

   ```bash
   bash scripts/live-artillery-demo.sh
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

   Para auditar requisitos de forma reproducible:

   ```bash
   bash scripts/audit-project.sh
   ```

## Argumento tecnico

El proyecto no se limita a revisar puertos abiertos. La plataforma monitorea una aplicacion con frontend, backend, persistencia en MariaDB y endpoints de telemetria. Artillery genera trafico y escrituras reales, mientras Zabbix observa disponibilidad, latencia HTTPS publica, exporter de metricas, estado de DB y recorrido sintetico HTTP.

## Evidencias esperadas

- `summary.json`: version, uptime y contadores.
- `db-status.json`: conexion, filas persistidas e incidentes.
- `slo.json`: disponibilidad calculada del proceso.
- `charts.json`: datos usados para graficas operativas.
- `compliance.json`: matriz de cumplimiento del enunciado.
- `metrics.prom`: metricas estilo Prometheus.
- `artillery-smoke.txt`: resultado de prueba de carga.
- `artillery-live.txt`: resultado de demo en vivo si se ejecuta `scripts/live-artillery-demo.sh`.
- `zabbix-items.json`: ultimos valores recibidos por Zabbix.
