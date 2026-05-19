# Matriz de rubrica y evidencias

Esta matriz traduce la rubrica del Proyecto 7 a evidencias concretas del repositorio, el despliegue y la sustentacion.

| Criterio | Peso | Como se cubre | Evidencia en el proyecto |
|---|---:|---|---|
| Diseño de soluciónes o procesos para atender necesidades de comunidades | 40% | Se disena una plataforma de monitoreo centralizada para infraestructura de servicios telematicos, con Zabbix Server, agentes, dashboards, triggers y alertas. | `docker-compose.yml`, `docker-compose.vps.yml`, `scripts/provision_zabbix.py`, dashboard Zabbix, `docs/INFORME_IEEE.md`. |
| Estructuracion del proceso de validación y seleccion de alternativa | 30% | El informe compara alternativas como Nagios, Prometheus, Datadog y Zabbix. La validación incluye pruebas minimas exigidas, carga con Artillery, auditoria automatica y evidencias exportables. | `docs/PRUEBAS.md`, `docs/DEMO_AVANZADA.md`, `scripts/audit-project.sh`, `scripts/evidence-pack.sh`, `tests/artillery-*.yml`. |
| Construccion y desarrollo de modelos/prototipos | 30% | Se implementa un prototipo funcional desplegado en VPS con HTTPS, backend Node.js, MariaDB, exporter `/metrics`, gráficas, SLO, matriz de cumplimiento y alertas MailHog/SMTP. | `services/web/`, `docker/`, `zabbix-config/`, `https://web-zabbix.negociocontigo.com`, `/api/compliance`, `/api/charts`, `/metrics`. |

## Requisitos tecnicos del enunciado

| Requisito | Cumplimiento | Evidencia |
|---|---|---|
| Mínimo 4 contenedores monitoreados: web, DB, DNS, FTP | Cumple | `web-service`, `db-service`, `dns-service`, `ftp-service`. |
| Zabbix Agent en cada host | Cumple | `web-agent`, `db-agent`, `dns-agent`, `ftp-agent`. |
| Monitoreo CPU, memoria y disco | Cumple | Template `Linux by Zabbix agent` aplicado a los hosts. |
| Zabbix Server con base de datos | Cumple | `zabbix-server` + `postgres`. |
| Frontend web Zabbix | Cumple | `zabbix-web` publicado en `https://zabbix.negociocontigo.com`. |
| Hosts, grupos, templates y triggers | Cumple | Aprovisionamiento automatico en `scripts/provision_zabbix.py`. |
| Dashboards personalizados | Cumple | Dashboard Zabbix y Centro de gráficas del portal. |
| Alertas por correo MailHog | Cumple | `mailhog`, `mailhog-gate`, media type Email y evidencias. |
| Monitoreo HTTP, MySQL, ping | Cumple | Checks `net.tcp.service`, `agent.ping` y web scenario público. |
| Docker Compose | Cumple | `docker-compose.yml` y `docker-compose.vps.yml`. |
| Imagen Zabbix personalizada | Cumple | `docker/zabbix-server/Dockerfile`. |
| Configuración Zabbix montada como volumen | Cumple | `docker/zabbix-server/zabbix_server.conf.d/proyecto7.conf`, `zabbix-config/agent/proyecto7-agent.conf`. |
| README con inventario, servicios y URLs | Cumple | `README.md`. |
| Dashboard en tiempo real | Cumple | Zabbix Latest data, dashboard, portal `/api/live`. |
| Simulacion de caída | Cumple | `scripts/test-failure.ps1` y comandos Docker en VPS. |
| Envío de alertas | Cumple | MailHog y SMTP real del dominio. |
| Métricas historicas | Cumple | Gráficas Zabbix, `/api/charts`, evidencias y auditoria. |

## Valor agregado para nivel sobresaliente

- Despliegue público HTTPS en subdominios reales.
- Aplicación monitoreada con frontend, backend y base de datos.
- Pruebas de carga con Artillery.
- Exporter estilo Prometheus en `/metrics`.
- SLO de laboratorio en `/api/slo`.
- Matriz automatica de cumplimiento en `/api/compliance`.
- Script de auditoria reproducible con salida en Markdown.
- Paquete de evidencias generado por script.

