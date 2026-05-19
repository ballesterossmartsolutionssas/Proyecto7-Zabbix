# Proyecto 7: Monitoreo de infraestructura con Zabbix

Integrantes:

- Juan Camilo Ballesteros Sierra
- Luis Felipe Murillo Matallana
- Juan Sebastian Delgado
- Daniela Castro Quinones

## Resumen

Este proyecto implementa una plataforma de monitoreo de infraestructura con Zabbix 6.x desplegada completamente en contenedores Docker. La solucion monitorea servicios web, base de datos, DNS y FTP, registra metricas de disponibilidad y recursos, define triggers de falla y valida el envio de alertas mediante MailHog. Como valor agregado, se publico el entorno en una VPS con HTTPS y se implemento una aplicacion real con frontend, backend Node.js, MariaDB, exporter de metricas, graficas operativas, SLO y pruebas de carga con Artillery.

## 1. Introduccion

Las infraestructuras de red requieren mecanismos de observabilidad para detectar fallas, analizar comportamiento historico y reducir tiempos de indisponibilidad. Zabbix permite centralizar metricas, eventos y alertas en una plataforma abierta, extensible y adecuada para entornos de servicios telematicos.

## 2. Contexto del problema

Una red con varios servicios puede fallar por caida de procesos, saturacion de recursos o problemas de conectividad. Sin monitoreo, la deteccion suele depender de reportes manuales. El objetivo es desplegar una solucion que permita visualizar estado en tiempo real, generar alarmas y consultar datos historicos.

## 3. Alternativas de solucion

Se consideran herramientas como Nagios, Prometheus, Datadog y Zabbix. Zabbix se selecciona porque integra servidor, agentes, frontend, triggers, dashboards y notificaciones sin depender de servicios externos pagos. Ademas, cuenta con imagenes Docker oficiales y soporte para monitoreo mediante agentes y checks de red.

## 4. Diseno de la solucion

La arquitectura se compone de:

- Zabbix Server 6.x.
- PostgreSQL como base de datos.
- Zabbix Web con Nginx.
- MailHog como SMTP de pruebas.
- Cuatro servicios monitoreados: HTTP, MySQL/MariaDB, DNS y FTP.
- Agentes Zabbix que reportan al servidor dentro de una red Docker interna.
- Servicio web publico con frontend, backend, MariaDB, endpoints JSON, `/metrics`, `/api/charts`, `/api/live` y `/api/compliance`.
- Publicacion HTTPS mediante subdominios `web-zabbix`, `zabbix` y `mailhog-zabbix` bajo `negociocontigo.com`.

La red Docker `proyecto7-monitoring` permite que Zabbix consulte agentes y servicios por nombre DNS interno.

## 5. Implementacion

El despliegue se realiza con Docker Compose. El archivo `.env` centraliza credenciales y zona horaria. El servidor Zabbix se construye con una imagen personalizada declarada en `docker/zabbix-server/Dockerfile`. Ademas, el stack monta archivos de configuracion Zabbix como volumen: `docker/zabbix-server/zabbix_server.conf.d/proyecto7.conf` para el servidor y `zabbix-config/agent/proyecto7-agent.conf` para los agentes. El script `scripts/provision_zabbix.py` usa la API JSON-RPC de Zabbix para crear el grupo de hosts, registrar hosts, crear items de disponibilidad, definir triggers de falla, configurar MailHog y crear checks HTTP avanzados. En la VPS se usa `docker-compose.vps.yml`, Caddy publica los subdominios con HTTPS y el servicio web expone un backend con telemetria persistida en MariaDB.

## 6. Pruebas

Se ejecutan cuatro pruebas minimas:

- Dashboard en tiempo real con metricas y disponibilidad.
- Simulacion de caida de servicio deteniendo un contenedor.
- Envio de alertas a MailHog.
- Consulta de graficas historicas para explicar comportamiento en el tiempo.
- Pruebas de carga con Artillery contra frontend, API, DB, endpoints de carga y exporter `/metrics`.
- Auditoria automatica con `scripts/audit-project.sh`, que valida Compose, endpoints publicos, matriz de cumplimiento y objetos principales de Zabbix por API.

## 7. Discusion

La solucion demuestra que Zabbix detecta cambios de estado despues del intervalo de sondeo configurado. La separacion por contenedores facilita reproducir fallas controladas. MailHog permite probar notificaciones sin depender de un proveedor externo, mientras que el canal SMTP real del dominio evidencia escalamiento externo. Las pruebas de carga permiten relacionar trafico, latencia, SLO, escritura en MariaDB y datos historicos, lo que mejora la sustentacion frente a un sitio meramente estatico.

## 8. Conclusiones

Zabbix es una herramienta adecuada para monitoreo de infraestructura en ambientes dockerizados. La solucion cumple con disponibilidad de hosts, estado de servicios, alertas, visualizacion historica y reproducibilidad mediante Docker Compose. El despliegue publico, el backend transaccional, las pruebas Artillery, el exporter `/metrics` y la matriz `/api/compliance` agregan evidencia suficiente para defender el proyecto por encima de los requisitos minimos.

## Referencias

- Zabbix Documentation. https://www.zabbix.com/documentation
- Docker Documentation. https://docs.docker.com
- MailHog. https://github.com/mailhog/MailHog
- Artillery Documentation. https://www.artillery.io/docs
- Caddy Documentation. https://caddyserver.com/docs
