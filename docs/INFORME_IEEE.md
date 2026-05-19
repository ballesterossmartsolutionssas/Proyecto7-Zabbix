# Proyecto 7: Monitoreo de infraestructura con Zabbix

Integrantes:

- Juan Camilo Ballesteros Sierra
- Luis Felipe Murillo Matallana
- Juan Sebastián Delgado
- Daniela Castro Quiñones

## Resumen

Este proyecto implementa una plataforma de monitoreo de infraestructura con Zabbix 6.x desplegada mediante Docker Compose. La solución monitorea una red de servicios compuesta por un portal web, una base de datos MariaDB, un servicio DNS CoreDNS y un servicio FTP VSFTPD. Para cada host se configuraron agentes Zabbix, items de disponibilidad, métricas de CPU, memoria y disco, triggers de falla y alertas por correo hacia MailHog. Como valor agregado, la solución se publicó en una VPS con HTTPS, se implementó una aplicación real con frontend y backend Node.js, se agregó persistencia de telemetría e incidentes en MariaDB, se expuso un exporter `/metrics`, se implementaron gráficas operativas, SLO de laboratorio y pruebas de carga con Artillery. La validación incluye pruebas de disponibilidad, caída controlada, recepción de alertas, métricas históricas, carga sintética y una auditoría automática de cumplimiento.

Palabras clave: Zabbix, Docker Compose, monitoreo, alertas, MailHog, Artillery, infraestructura.

## 1. Introducción

Las infraestructuras telemáticas modernas dependen de varios servicios que deben mantenerse disponibles de forma simultánea. Un portal web puede estar activo, pero si la base de datos no responde, el sistema completo queda degradado. De igual forma, un servicio DNS o FTP puede fallar sin que sea evidente para el usuario final hasta que se presenta una interrupción funcional. Por esta razón, el monitoreo centralizado es una práctica esencial para detectar fallas, medir disponibilidad, generar alertas y conservar información histórica para análisis posterior.

El objetivo del proyecto es implementar una plataforma de monitoreo usando Zabbix 6.x, Zabbix Agent, base de datos, Docker y Docker Compose. El sistema debía observar al menos cuatro contenedores, mostrar métricas básicas, generar alertas y permitir pruebas de falla. La solución desarrollada cumple esos requerimientos y agrega una capa de demostración pública: un portal HTTPS que expone backend, métricas, gráficas, carga controlada y una matriz de cumplimiento verificable.

## 2. Contexto del problema

El problema abordado consiste en la falta de visibilidad sobre el estado de una infraestructura compuesta por servicios heterogéneos. Sin monitoreo, la disponibilidad de cada componente se revisa manualmente o se detecta solamente cuando el usuario reporta una falla. Este enfoque no permite reaccionar de forma proactiva, dificulta identificar la causa raíz y no conserva datos históricos para comparar comportamiento normal contra condiciones de falla o carga.

Para simular un escenario realista, se desplegaron servicios de distinta naturaleza: HTTP, base de datos, DNS y FTP. Estos servicios representan componentes comunes de una red institucional o empresarial. La plataforma de monitoreo debe responder preguntas operativas concretas: si el host está activo, si el servicio responde en su puerto, si existe consumo anormal de recursos, si una caída genera un problema visible, si la alerta llega por correo y si las métricas se conservan para análisis histórico.

## 3. Alternativas de solución

Se analizaron varias alternativas. Nagios es una opción clásica para monitoreo de disponibilidad, pero requiere más integración externa para dashboards modernos y gestión de métricas amplias. Prometheus es fuerte en métricas y series de tiempo, pero su modelo se enfoca en scraping y normalmente requiere Alertmanager y Grafana para cubrir notificaciones y visualización completa. Datadog ofrece una experiencia integrada, pero depende de un servicio externo pago. Zabbix fue seleccionado porque integra servidor, agentes, frontend web, base de datos, triggers, dashboards, mapas, web scenarios y media types en una sola plataforma abierta.

Zabbix también se ajusta al enunciado del proyecto porque soporta monitoreo por agente y checks de red simples como HTTP, TCP, FTP y ping. Además, cuenta con imágenes Docker oficiales, API JSON-RPC para automatizar aprovisionamiento y una interfaz web suficiente para sustentar hosts, latest data, problems, dashboards y gráficas históricas.

## 4. Diseño de la solución

La arquitectura se compone de dos capas. La primera es la capa de monitoreo, formada por Zabbix Server 6.x, PostgreSQL, Zabbix Web y MailHog. La segunda es la infraestructura monitoreada, formada por `web-service`, `db-service`, `dns-service` y `ftp-service`, cada uno acompañado por su respectivo contenedor Zabbix Agent. Todos los componentes se conectan mediante redes Docker, lo que permite que Zabbix consulte agentes y servicios usando nombres internos estables.

El inventario queda definido así:

| Host en Zabbix | Servicio | Check principal | Agente |
|---|---|---|---|
| `web-host` | Portal Node.js / HTTP | `net.tcp.service[http,web-service,80]` | `web-agent` |
| `db-host` | MariaDB | `net.tcp.service[tcp,db-service,3306]` | `db-agent` |
| `dns-host` | CoreDNS | `net.tcp.service[tcp,dns-service,53]` | `dns-agent` |
| `ftp-host` | VSFTPD | `net.tcp.service[ftp,ftp-service,21]` | `ftp-agent` |

Para reforzar la demostración, el servicio web no es una página estática. Se implementó como una aplicación Node.js con frontend, backend, endpoints JSON, persistencia en MariaDB, generación de incidentes, telemetría sintética y rutas de carga controlada. El portal público expone `/health`, `/api/summary`, `/api/db/status`, `/api/live`, `/api/charts`, `/api/slo`, `/api/compliance` y `/metrics`. Esto permite que Zabbix observe no solo puertos abiertos, sino también comportamiento funcional del sistema.

En la VPS, Caddy publica tres subdominios HTTPS: `web-zabbix.negociocontigo.com`, `zabbix.negociocontigo.com` y `mailhog-zabbix.negociocontigo.com`. Esta decisión facilita la sustentación remota y demuestra un despliegue más cercano a un ambiente real.

## 5. Implementación

El despliegue se empaqueta con Docker Compose. El archivo `docker-compose.yml` define el entorno local con Zabbix, base de datos, MailHog, servicios monitoreados y agentes. El archivo `docker-compose.vps.yml` adapta el despliegue a la VPS, evitando exponer puertos internos innecesarios y conectando los servicios públicos a la red donde Caddy publica HTTPS.

El servidor Zabbix usa una imagen personalizada construida desde `docker/zabbix-server/Dockerfile`. También se montan configuraciones como volúmenes: `docker/zabbix-server/zabbix_server.conf.d/proyecto7.conf` para el servidor y `zabbix-config/agent/proyecto7-agent.conf` para los agentes. Con esto se cumple el requisito de imagen personalizada y configuración montada.

La configuración de Zabbix se automatizó con `scripts/provision_zabbix.py`. Este script usa la API JSON-RPC para crear el grupo `Proyecto 7 - Infraestructura Docker`, registrar hosts, asociar templates, crear items de disponibilidad, definir triggers, configurar MailHog, crear dashboard y agregar un web scenario público. Los triggers principales detectan servicios que no responden y ausencia de datos del agente. Los items avanzados consultan latencia HTTPS pública, estado de MariaDB desde API y exporter `/metrics`.

La aplicación web implementa endpoints para demostración y pruebas. `/api/telemetry` permite registrar muestras sintéticas de CPU, memoria y disco; `/api/incidents` permite crear y listar incidentes persistidos; `/api/load/*` ejecuta carga controlada para observar respuesta del backend; `/api/charts` alimenta las gráficas del portal; `/api/compliance` resume el cumplimiento del enunciado y `/metrics` publica contadores estilo Prometheus para integración con Zabbix HTTP agent.

## 6. Pruebas

Se ejecutaron las pruebas mínimas exigidas por el enunciado:

1. Dashboard en tiempo real: en Zabbix se revisan hosts, latest data, agent ping, CPU, memoria, disco y disponibilidad de HTTP, MySQL, DNS y FTP. En el portal público se complementa con Load Lab y Centro de gráficas.
2. Simulación de caída: se detiene `web-service` durante un período controlado. Zabbix detecta que el servicio HTTP no responde, abre un problema y luego lo marca como recuperado cuando el contenedor vuelve a iniciar.
3. Envío de alertas: el media type Email envía notificaciones a MailHog. El portal `mailhog-zabbix` permite evidenciar correos de problema y recuperación.
4. Métricas históricas: Zabbix conserva gráficas por item y el portal muestra tendencias de telemetría, rutas golpeadas, cargas recientes y SLO.

Adicionalmente, se agregaron pruebas con Artillery. El escenario `tests/artillery-smoke.yml` valida una corrida rápida contra frontend, salud, resumen, DB, SLO, gráficas, cumplimiento, incidentes y métricas. El escenario `tests/artillery-live-demo.yml` genera tráfico visible durante la sustentación. El escenario `tests/artillery-stress-demo.yml` permite una saturación controlada opcional. En producción, la prueba smoke reciente generó 96 requests, 0 usuarios fallidos y p95 aproximado de 23.8 ms.

También se creó `scripts/audit-project.sh`, que genera un reporte Markdown validando sintaxis de Compose, endpoints públicos, matriz de cumplimiento y objetos principales de Zabbix. La auditoría reciente reportó 27 validaciones OK y 0 fallidas. Esto facilita demostrar que el proyecto no depende solo de capturas, sino de pruebas reproducibles.

## 7. Discusión de las pruebas

Los resultados muestran que la solución detecta fallas de disponibilidad y las transforma en eventos operativos. El uso de agentes permite cubrir recursos del host como CPU, memoria y disco, mientras que los checks TCP/HTTP/FTP validan el estado funcional de servicios concretos. La prueba de caída confirma el flujo completo: falla, problema en Zabbix, alerta por correo, recuperación y registro histórico.

Las pruebas de carga agregan un componente que no estaba en el requerimiento mínimo. Al generar tráfico con Artillery, el portal muestra requests, cargas ejecutadas, telemetría, SLO y rutas más consultadas. Esto permite explicar cómo un equipo de operaciones puede usar las métricas para diferenciar una caída total de una degradación por carga. La integración de `/metrics` y `/api/db/status` con Zabbix amplía el monitoreo más allá de puertos abiertos.

MailHog cumple el rol de servidor SMTP de laboratorio, evitando enviar pruebas a usuarios reales. Además, se configuró un canal SMTP del dominio para evidenciar cómo se podría escalar la alerta fuera del laboratorio. Esta combinación permite validar tanto el flujo controlado como una aproximación más realista.

## 8. Conclusiones

La solución cumple los requerimientos del Proyecto 7: despliegue con Docker Compose, mínimo cuatro hosts monitoreados, Zabbix Server con base de datos, frontend web, templates, triggers, dashboard, alertas por correo, pruebas de caída y métricas históricas. El README contiene inventario, servicios configurados, URLs y paso a paso de despliegue.

El valor agregado está en convertir el host web en una aplicación observable real, con backend, MariaDB, endpoints de salud, exporter, SLO, gráficas y pruebas de carga. Esto permite sustentar no solo que Zabbix está instalado, sino que la plataforma observa comportamiento operativo verificable. La matriz `/api/compliance` y el script de auditoría hacen que la evaluación sea trazable frente al enunciado y la rúbrica.

Como trabajo futuro, se podría agregar monitoreo del socket Docker, dashboards exportados automáticamente, mapas de red, retención de métricas ajustada por severidad y notificaciones hacia canales colaborativos como Slack o Microsoft Teams.

## Referencias

- Zabbix Documentation. https://www.zabbix.com/documentation
- Docker Documentation. https://docs.docker.com
- MailHog. https://github.com/mailhog/MailHog
- Artillery Documentation. https://www.artillery.io/docs
- Caddy Documentation. https://caddyserver.com/docs
