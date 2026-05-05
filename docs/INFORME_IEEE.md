# Proyecto 7: Monitoreo de infraestructura con Zabbix

Integrantes:

- Juan Camilo Ballesteros Sierra
- Luis Felipe Murillo Matallana
- Juan Sebastian Delgado
- Daniela Castro Quinones

## Resumen

Este proyecto implementa una plataforma de monitoreo de infraestructura con Zabbix desplegada completamente en contenedores Docker. La solucion monitorea servicios web, base de datos, DNS y FTP, registra metricas de disponibilidad y recursos, define triggers de falla y valida el envio de alertas mediante MailHog.

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

La red Docker `proyecto7-monitoring` permite que Zabbix consulte agentes y servicios por nombre DNS interno.

## 5. Implementacion

El despliegue se realiza con `docker compose up -d`. El archivo `.env` centraliza credenciales y zona horaria. El servidor Zabbix se construye con una imagen personalizada declarada en `docker/zabbix-server/Dockerfile`. Ademas, el stack monta archivos de configuracion Zabbix como volumen: `docker/zabbix-server/zabbix_server.conf.d/proyecto7.conf` para el servidor y `zabbix-config/agent/proyecto7-agent.conf` para los agentes. El script `scripts/provision_zabbix.py` usa la API JSON-RPC de Zabbix para crear el grupo de hosts, registrar hosts, crear items de disponibilidad y definir triggers de falla.

## 6. Pruebas

Se ejecutan cuatro pruebas minimas:

- Dashboard en tiempo real con metricas y disponibilidad.
- Simulacion de caida de servicio deteniendo un contenedor.
- Envio de alertas a MailHog.
- Consulta de graficas historicas para explicar comportamiento en el tiempo.

## 7. Discusion

La solucion demuestra que Zabbix detecta cambios de estado despues del intervalo de sondeo configurado. La separacion por contenedores facilita reproducir fallas controladas. MailHog permite probar notificaciones sin depender de un proveedor de correo externo.

## 8. Conclusiones

Zabbix es una herramienta adecuada para monitoreo de infraestructura en ambientes dockerizados. La solucion cumple con disponibilidad de hosts, estado de servicios, alertas y visualizacion historica. Como mejora futura, se podria agregar monitoreo del socket Docker, plantillas especificas por servicio y dashboards exportados automaticamente.

## Referencias

- Zabbix Documentation. https://www.zabbix.com/documentation
- Docker Documentation. https://docs.docker.com
- MailHog. https://github.com/mailhog/MailHog
