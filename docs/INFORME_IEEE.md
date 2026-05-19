# Proyecto 7: Monitoreo de infraestructura con Zabbix

Integrantes:

- Juan Camilo Ballesteros Sierra
- Luis Felipe Murillo Matallana
- Juan Sebastian Delgado
- Daniela Castro Quinones

## Resumen

Este proyecto implementa una plataforma de monitoreo de infraestructura con Zabbix 6.x desplegada mediante Docker Compose. La solucion monitorea una red de servicios compuesta por un portal web, una base de datos MariaDB, un servicio DNS CoreDNS y un servicio FTP VSFTPD. Para cada host se configuraron agentes Zabbix, items de disponibilidad, metricas de CPU, memoria y disco, triggers de falla y alertas por correo hacia MailHog. Como valor agregado, la solucion se publico en una VPS con HTTPS, se implemento una aplicacion real con frontend y backend Node.js, se agrego persistencia de telemetria e incidentes en MariaDB, se expuso un exporter `/metrics`, se implementaron graficas operativas, SLO de laboratorio y pruebas de carga con Artillery. La validacion incluye pruebas de disponibilidad, caida controlada, recepcion de alertas, metricas historicas, carga sintetica y una auditoria automatica de cumplimiento.

Palabras clave: Zabbix, Docker Compose, monitoreo, alertas, MailHog, Artillery, infraestructura.

## 1. Introduccion

Las infraestructuras telematicas modernas dependen de varios servicios que deben mantenerse disponibles de forma simultanea. Un portal web puede estar activo, pero si la base de datos no responde, el sistema completo queda degradado. De igual forma, un servicio DNS o FTP puede fallar sin que sea evidente para el usuario final hasta que se presenta una interrupcion funcional. Por esta razon, el monitoreo centralizado es una practica esencial para detectar fallas, medir disponibilidad, generar alertas y conservar informacion historica para analisis posterior.

El objetivo del proyecto es implementar una plataforma de monitoreo usando Zabbix 6.x, Zabbix Agent, base de datos, Docker y Docker Compose. El sistema debia observar al menos cuatro contenedores, mostrar metricas basicas, generar alertas y permitir pruebas de falla. La solucion desarrollada cumple esos requerimientos y agrega una capa de demostracion publica: un portal HTTPS que expone backend, metricas, graficas, carga controlada y una matriz de cumplimiento verificable.

## 2. Contexto del problema

El problema abordado consiste en la falta de visibilidad sobre el estado de una infraestructura compuesta por servicios heterogeneos. Sin monitoreo, la disponibilidad de cada componente se revisa manualmente o se detecta solamente cuando el usuario reporta una falla. Este enfoque no permite reaccionar de forma proactiva, dificulta identificar la causa raiz y no conserva datos historicos para comparar comportamiento normal contra condiciones de falla o carga.

Para simular un escenario realista, se desplegaron servicios de distinta naturaleza: HTTP, base de datos, DNS y FTP. Estos servicios representan componentes comunes de una red institucional o empresarial. La plataforma de monitoreo debe responder preguntas operativas concretas: si el host esta activo, si el servicio responde en su puerto, si existe consumo anormal de recursos, si una caida genera un problema visible, si la alerta llega por correo y si las metricas se conservan para analisis historico.

## 3. Alternativas de solucion

Se analizaron varias alternativas. Nagios es una opcion clasica para monitoreo de disponibilidad, pero requiere mas integracion externa para dashboards modernos y gestion de metricas amplias. Prometheus es fuerte en metricas y series de tiempo, pero su modelo se enfoca en scraping y normalmente requiere Alertmanager y Grafana para cubrir notificaciones y visualizacion completa. Datadog ofrece una experiencia integrada, pero depende de un servicio externo pago. Zabbix fue seleccionado porque integra servidor, agentes, frontend web, base de datos, triggers, dashboards, mapas, web scenarios y media types en una sola plataforma abierta.

Zabbix tambien se ajusta al enunciado del proyecto porque soporta monitoreo por agente y checks de red simples como HTTP, TCP, FTP y ping. Ademas, cuenta con imagenes Docker oficiales, API JSON-RPC para automatizar aprovisionamiento y una interfaz web suficiente para sustentar hosts, latest data, problems, dashboards y graficas historicas.

## 4. Diseno de la solucion

La arquitectura se compone de dos capas. La primera es la capa de monitoreo, formada por Zabbix Server 6.x, PostgreSQL, Zabbix Web y MailHog. La segunda es la infraestructura monitoreada, formada por `web-service`, `db-service`, `dns-service` y `ftp-service`, cada uno acompanado por su respectivo contenedor Zabbix Agent. Todos los componentes se conectan mediante redes Docker, lo que permite que Zabbix consulte agentes y servicios usando nombres internos estables.

El inventario queda definido asi:

| Host en Zabbix | Servicio | Check principal | Agente |
|---|---|---|---|
| `web-host` | Portal Node.js / HTTP | `net.tcp.service[http,web-service,80]` | `web-agent` |
| `db-host` | MariaDB | `net.tcp.service[tcp,db-service,3306]` | `db-agent` |
| `dns-host` | CoreDNS | `net.tcp.service[tcp,dns-service,53]` | `dns-agent` |
| `ftp-host` | VSFTPD | `net.tcp.service[ftp,ftp-service,21]` | `ftp-agent` |

Para reforzar la demostracion, el servicio web no es una pagina estatica. Se implemento como una aplicacion Node.js con frontend, backend, endpoints JSON, persistencia en MariaDB, generacion de incidentes, telemetria sintetica y rutas de carga controlada. El portal publico expone `/health`, `/api/summary`, `/api/db/status`, `/api/live`, `/api/charts`, `/api/slo`, `/api/compliance` y `/metrics`. Esto permite que Zabbix observe no solo puertos abiertos, sino tambien comportamiento funcional del sistema.

En la VPS, Caddy publica tres subdominios HTTPS: `web-zabbix.negociocontigo.com`, `zabbix.negociocontigo.com` y `mailhog-zabbix.negociocontigo.com`. Esta decision facilita la sustentacion remota y demuestra un despliegue mas cercano a un ambiente real.

## 5. Implementacion

El despliegue se empaqueta con Docker Compose. El archivo `docker-compose.yml` define el entorno local con Zabbix, base de datos, MailHog, servicios monitoreados y agentes. El archivo `docker-compose.vps.yml` adapta el despliegue a la VPS, evitando exponer puertos internos innecesarios y conectando los servicios publicos a la red donde Caddy publica HTTPS.

El servidor Zabbix usa una imagen personalizada construida desde `docker/zabbix-server/Dockerfile`. Tambien se montan configuraciones como volumenes: `docker/zabbix-server/zabbix_server.conf.d/proyecto7.conf` para el servidor y `zabbix-config/agent/proyecto7-agent.conf` para los agentes. Con esto se cumple el requisito de imagen personalizada y configuracion montada.

La configuracion de Zabbix se automatizo con `scripts/provision_zabbix.py`. Este script usa la API JSON-RPC para crear el grupo `Proyecto 7 - Infraestructura Docker`, registrar hosts, asociar templates, crear items de disponibilidad, definir triggers, configurar MailHog, crear dashboard y agregar un web scenario publico. Los triggers principales detectan servicios que no responden y ausencia de datos del agente. Los items avanzados consultan latencia HTTPS publica, estado de MariaDB desde API y exporter `/metrics`.

La aplicacion web implementa endpoints para demostracion y pruebas. `/api/telemetry` permite registrar muestras sinteticas de CPU, memoria y disco; `/api/incidents` permite crear y listar incidentes persistidos; `/api/load/*` ejecuta carga controlada para observar respuesta del backend; `/api/charts` alimenta las graficas del portal; `/api/compliance` resume el cumplimiento del enunciado y `/metrics` publica contadores estilo Prometheus para integracion con Zabbix HTTP agent.

## 6. Pruebas

Se ejecutaron las pruebas minimas exigidas por el enunciado:

1. Dashboard en tiempo real: en Zabbix se revisan hosts, latest data, agent ping, CPU, memoria, disco y disponibilidad de HTTP, MySQL, DNS y FTP. En el portal publico se complementa con Load Lab y Centro de graficas.
2. Simulacion de caida: se detiene `web-service` durante un periodo controlado. Zabbix detecta que el servicio HTTP no responde, abre un problema y luego lo marca como recuperado cuando el contenedor vuelve a iniciar.
3. Envio de alertas: el media type Email envia notificaciones a MailHog. El portal `mailhog-zabbix` permite evidenciar correos de problema y recuperacion.
4. Metricas historicas: Zabbix conserva graficas por item y el portal muestra tendencias de telemetria, rutas golpeadas, cargas recientes y SLO.

Adicionalmente, se agregaron pruebas con Artillery. El escenario `tests/artillery-smoke.yml` valida una corrida rapida contra frontend, salud, resumen, DB, SLO, graficas, cumplimiento, incidentes y metricas. El escenario `tests/artillery-live-demo.yml` genera trafico visible durante la sustentacion. El escenario `tests/artillery-stress-demo.yml` permite una saturacion controlada opcional. En produccion, la prueba smoke reciente genero 96 requests, 0 usuarios fallidos y p95 aproximado de 23.8 ms.

Tambien se creo `scripts/audit-project.sh`, que genera un reporte Markdown validando sintaxis de Compose, endpoints publicos, matriz de cumplimiento y objetos principales de Zabbix. La auditoria reciente reporto 27 validaciones OK y 0 fallidas. Esto facilita demostrar que el proyecto no depende solo de capturas, sino de pruebas reproducibles.

## 7. Discusion de las pruebas

Los resultados muestran que la solucion detecta fallas de disponibilidad y las transforma en eventos operativos. El uso de agentes permite cubrir recursos del host como CPU, memoria y disco, mientras que los checks TCP/HTTP/FTP validan el estado funcional de servicios concretos. La prueba de caida confirma el flujo completo: falla, problema en Zabbix, alerta por correo, recuperacion y registro historico.

Las pruebas de carga agregan un componente que no estaba en el requerimiento minimo. Al generar trafico con Artillery, el portal muestra requests, cargas ejecutadas, telemetria, SLO y rutas mas consultadas. Esto permite explicar como un equipo de operaciones puede usar las metricas para diferenciar una caida total de una degradacion por carga. La integracion de `/metrics` y `/api/db/status` con Zabbix amplia el monitoreo mas alla de puertos abiertos.

MailHog cumple el rol de servidor SMTP de laboratorio, evitando enviar pruebas a usuarios reales. Ademas, se configuro un canal SMTP del dominio para evidenciar como se podria escalar la alerta fuera del laboratorio. Esta combinacion permite validar tanto el flujo controlado como una aproximacion mas realista.

## 8. Conclusiones

La solucion cumple los requerimientos del Proyecto 7: despliegue con Docker Compose, minimo cuatro hosts monitoreados, Zabbix Server con base de datos, frontend web, templates, triggers, dashboard, alertas por correo, pruebas de caida y metricas historicas. El README contiene inventario, servicios configurados, URLs y paso a paso de despliegue.

El valor agregado esta en convertir el host web en una aplicacion observable real, con backend, MariaDB, endpoints de salud, exporter, SLO, graficas y pruebas de carga. Esto permite sustentar no solo que Zabbix esta instalado, sino que la plataforma observa comportamiento operativo verificable. La matriz `/api/compliance` y el script de auditoria hacen que la evaluacion sea trazable frente al enunciado y la rubrica.

Como trabajo futuro, se podria agregar monitoreo del socket Docker, dashboards exportados automaticamente, mapas de red, retencion de metricas ajustada por severidad y notificaciones hacia canales colaborativos como Slack o Microsoft Teams.

## Referencias

- Zabbix Documentation. https://www.zabbix.com/documentation
- Docker Documentation. https://docs.docker.com
- MailHog. https://github.com/mailhog/MailHog
- Artillery Documentation. https://www.artillery.io/docs
- Caddy Documentation. https://caddyserver.com/docs
