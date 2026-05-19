# Presentación - Proyecto 7

Archivo principal: `entrega-final/Presentacion_Proyecto7_Zabbix.pptx`.

La presentación final tiene 14 diapositivas y está organizada para 20 minutos. El hilo de la sustentación es este: partimos del monitoreo básico pedido por el enunciado, pero lo llevamos a observabilidad operativa con una app real, carga, incidentes, SLO, métricas exportables, alertas y auditoría.

## Diapositiva 1 - Portada

Proyecto 7: Monitoreo de infraestructura con Zabbix.

## Diapositiva 2 - Problema

El riesgo real es enterarse tarde de una caída. Sin monitoreo centralizado, la revisión es manual, no hay histórico y la evidencia aparece después del problema.

## Diapositiva 3 - Objetivo

Montamos algo que se puede medir, presionar y recuperar. La base es Zabbix + Docker Compose + cuatro servicios; el valor extra es la consola web con backend, MariaDB, SLO, gráficas, incidentes y Artillery.

## Diapositiva 4 - Arquitectura Docker

Zabbix queda mirando servicios reales en Docker: Zabbix Server, PostgreSQL, Zabbix Web, MailHog, agentes y cuatro servicios monitoreados publicados con HTTPS en la VPS.

## Diapositiva 5 - Inventario monitoreado

- `web-host`: portal Node.js HTTP.
- `db-host`: MariaDB puerto 3306.
- `dns-host`: CoreDNS puerto 53.
- `ftp-host`: VSFTPD puerto 21.

## Diapositiva 6 - Implementación

Todo se puede levantar de nuevo desde el repo: Compose, Dockerfile personalizado, archivos de configuración montados como volumen y aprovisionamiento por API con `provision_zabbix.py`.

## Diapositiva 7 - Dashboard

El dashboard muestra el pulso del sistema: recursos, servicios, estado general y problemas visibles para operación.

## Diapositiva 8 - Métricas

Latest data muestra qué responde y qué no. Aquí se conectan los checks básicos con disponibilidad HTTP, MariaDB, DNS, FTP, `/metrics` y web scenario.

## Diapositiva 9 - Caída controlada

La caída controlada prueba el flujo completo: detener servicio, abrir problema, enviar alerta, restaurar y conservar histórico.

## Diapositiva 10 - Alertas

MailHog muestra la alerta sin enviar spam. Sirve para sustentar correos de problema y recuperación dentro de un laboratorio controlado.

## Diapositiva 11 - Carga

Artillery mete presión real a la demo. Mientras corre, la consola muestra requests, rutas, SLO, cargas recientes y telemetría.

## Diapositiva 12 - Resultados

El cierre se defiende con métricas y auditoría: `/api/compliance`, auditoría automática, Zabbix, MailHog y evidencias PNG.

## Diapositiva 13 - Entregables

- Informe IEEE.
- Diapositivas.
- Repositorio GitHub.
- Evidencias.
- Guion para el grupo.

## Diapositiva 14 - Demo en vivo

- Abrir `web-zabbix.negociocontigo.com`.
- Ejecutar `artillery run tests/artillery-live-demo.yml`.
- Simular caída con `docker compose -f docker-compose.vps.yml stop web-service`.
- Cerrar con `bash scripts/audit-project.sh`.
