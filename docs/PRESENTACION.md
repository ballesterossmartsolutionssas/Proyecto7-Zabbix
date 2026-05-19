# Presentación - Proyecto 7

Archivo principal: `entrega-final/Presentacion_Proyecto7_Zabbix.pptx`.

La presentación final tiene 14 diapositivas y está organizada para una sustentación de 20 minutos. La distribución recomendada es: Luis Felipe presenta problema y objetivo; Juan Sebastián presenta arquitectura e implementación Docker; Daniela presenta Zabbix, dashboard y alertas; Juan Camilo cierra con pruebas, Artillery, resultados, entregables y demo en vivo.

## Diapositiva 1 - Portada

Proyecto 7: Monitoreo de infraestructura con Zabbix.

Integrantes:

- Juan Camilo Ballesteros Sierra
- Luis Felipe Murillo Matallana
- Juan Sebastián Delgado
- Daniela Castro Quiñones

## Diapositiva 2 - Problema

- Servicios distribuidos pueden fallar sin aviso.
- La revisión manual tarda y no deja historial.
- Se necesita visibilidad, alertas y evidencia para sustentación.

## Diapositiva 3 - Objetivo

- Desplegar Zabbix 6.x en Docker Compose.
- Monitorear web, base de datos, DNS y FTP.
- Validar triggers, dashboards, históricos y alertas por correo.
- Agregar portal HTTPS con backend, gráficas, SLO y carga Artillery.

## Diapositiva 4 - Arquitectura Docker

- Zabbix Server + PostgreSQL + Zabbix Web.
- MailHog simula SMTP para notificaciones.
- Red interna `proyecto7-monitoring` para resolución por nombre.
- Caddy publica subdominios HTTPS en la VPS.

## Diapositiva 5 - Inventario monitoreado

- `web-host`: portal Node.js HTTP.
- `db-host`: MariaDB puerto 3306.
- `dns-host`: CoreDNS puerto 53.
- `ftp-host`: VSFTPD puerto 21.

## Diapositiva 6 - Implementación

- `docker-compose.yml` define todos los componentes.
- Zabbix Server usa imagen personalizada con Dockerfile.
- Las configuraciones Zabbix se montan como volumen.
- `provision_zabbix.py` registra hosts, items, triggers y web scenario por API.

## Diapositiva 7 - Dashboard y datos

- Latest data muestra disponibilidad y métricas.
- Centro de gráficas muestra CPU, memoria, disco, rutas y carga.
- La matriz de cumplimiento `/api/compliance` cruza requisitos contra evidencia.

## Diapositiva 8 - Prueba de caída

- Se detiene `web-service` durante la demostración.
- Zabbix marca el trigger HTTP `web-service` no responde.
- Al restaurar el contenedor, el evento queda resuelto.

## Diapositiva 9 - Alertas con MailHog

- MailHog recibe correos de problema y recuperación.
- El portal `mailhog-zabbix` tiene login propio.
- También existe canal SMTP real del dominio para escalamiento.

## Diapositiva 10 - Pruebas de carga

- Artillery genera tráfico real contra frontend y API.
- El backend registra telemetría e incidentes en MariaDB.
- Zabbix observa `/metrics`, estado de DB y web scenario público.

## Diapositiva 11 - Resultados

- Contenedores principales saludables.
- Cuatro servicios con check de disponibilidad activo.
- Alertas generadas y recuperadas durante la prueba.
- Auditoría automática con 0 fallas esperadas.

## Diapositiva 12 - Entregables

- Informe IEEE: `entrega-final/Informe_IEEE_Proyecto7_Zabbix.pdf`.
- Diapositivas: `entrega-final/Presentacion_Proyecto7_Zabbix.pptx`.
- Repositorio GitHub con README, Compose, scripts y evidencias.

## Diapositiva 13 - Conclusiones

- Zabbix centraliza observabilidad operativa.
- Docker Compose hace el despliegue reproducible.
- El portal público, Artillery y `/api/compliance` elevan la solución sobre el mínimo.

## Diapositiva 14 - Demo en vivo

- Abrir `web-zabbix.negociocontigo.com`.
- Ejecutar `artillery run tests/artillery-live-demo.yml`.
- Simular caída con `docker compose -f docker-compose.vps.yml stop web-service`.
- Cerrar con `bash scripts/audit-project.sh`.
