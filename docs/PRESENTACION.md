# Presentación - Proyecto 7

Archivo principal: `entrega-final/Presentacion_Proyecto7_Zabbix.pptx`.

La presentación final tiene 18 diapositivas y está organizada para 20 minutos. El hilo de la sustentación es este: partimos del monitoreo básico pedido por el enunciado, comparamos alternativas, justificamos Zabbix y luego mostramos arquitectura, despliegue real, monitoreo, pruebas, alertas y evidencias.

## Diapositiva 1 - Portada

Proyecto 7: Monitoreo de infraestructura con Zabbix.

## Diapositiva 2 - Problema

El riesgo real es enterarse tarde de una caída. Sin monitoreo centralizado, la revisión es manual, no hay histórico y la evidencia aparece después del problema.

## Diapositiva 3 - Alternativas

Matriz ponderada entre Nagios, Prometheus, Datadog y Zabbix. Se explica por qué Zabbix fue la mejor opción para Docker Compose, alertas, API, dashboards y ajuste académico.

## Diapositiva 4 - Objetivo

Montamos algo que se puede medir, presionar y recuperar. La base es Zabbix + Docker Compose + cuatro servicios; el valor extra es la consola web con backend, MariaDB, SLO, gráficas, incidentes y Artillery.

## Diapositiva 5 - Arquitectura lógica

Muestra cómo se relacionan usuarios, portal web, API, Zabbix Web, Zabbix Server, bases de datos, MailHog, agentes y servicios monitoreados.

## Diapositiva 6 - Despliegue en VPS

Muestra la publicación real en Hostinger: DNS, Caddy con HTTPS, Docker Compose, red externa `negociocontigo_default` y red interna `proyecto7-monitoring`.

## Diapositiva 7 - Inventario monitoreado

- `web-host`: portal Node.js HTTP.
- `db-host`: MariaDB puerto 3306.
- `dns-host`: CoreDNS puerto 53.
- `ftp-host`: VSFTPD puerto 21.

## Diapositiva 8 - Implementación

Todo se puede levantar de nuevo desde el repo: Compose, Dockerfile personalizado, archivos de configuración montados como volumen y aprovisionamiento por API con `provision_zabbix.py`.

## Diapositiva 9 - Dashboard

El dashboard muestra el pulso del sistema: recursos, servicios, estado general y problemas visibles para operación.

## Diapositiva 10 - Métricas

Latest data muestra qué responde y qué no. Aquí se conectan los checks básicos con disponibilidad HTTP, MariaDB, DNS, FTP, `/metrics` y web scenario.

## Diapositiva 11 - Caída controlada

La caída controlada prueba el flujo completo: detener servicio, abrir problema, enviar alerta, restaurar y conservar histórico.

## Diapositiva 12 - Alertas

MailHog muestra la alerta sin enviar spam. Sirve para sustentar correos de problema y recuperación dentro de un laboratorio controlado.

## Diapositiva 13 - Carga

Artillery mete presión real a la demo. Mientras corre, la consola muestra requests, rutas, SLO, cargas recientes y telemetría.

## Diapositiva 14 - Resultados

El cierre se defiende con métricas y auditoría: `/api/compliance`, auditoría automática, Zabbix, MailHog y evidencias PNG.

## Diapositiva 15 - Discusión y conclusiones

Explica qué se probó, qué se aprendió, limitaciones honestas y conclusión principal.

## Diapositiva 16 - Entregables

- Informe IEEE.
- Diapositivas.
- Repositorio GitHub.
- Evidencias.
- Guion para el grupo.

## Diapositiva 17 - Demo en vivo

- Abrir `web-zabbix.negociocontigo.com`.
- Ejecutar `artillery run tests/artillery-live-demo.yml`.
- Simular caída con `docker compose -f docker-compose.vps.yml stop web-service`.
- Cerrar con `bash scripts/audit-project.sh`.

## Diapositiva 18 - Referencias

Documentación oficial de Zabbix, Docker Compose, MailHog, Artillery, PostgreSQL/MariaDB y Caddy.
