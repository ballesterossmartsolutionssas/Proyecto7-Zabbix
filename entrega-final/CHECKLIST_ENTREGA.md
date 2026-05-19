# Checklist de entrega - Proyecto 7

- [x] docker-compose.yml con Zabbix Server, Zabbix Web, base de datos, MailHog y 4 servicios monitoreados.
- [x] Imagen Zabbix personalizada con Dockerfile.
- [x] Archivos de configuracion Zabbix montados como volumen.
- [x] Hosts monitoreados: web, DB, DNS y FTP.
- [x] Triggers de disponibilidad configurados.
- [x] Alertas por correo validadas en MailHog.
- [x] README con instrucciones de despliegue.
- [x] Informe IEEE en DOCX y PDF.
- [x] Presentacion PPTX.
- [x] Evidencias PNG de dashboard, hosts, latest data, falla y MailHog.
- [x] Web publica con backend, MariaDB, graficas, SLO, exporter `/metrics` y pruebas Artillery.
- [x] Matriz de cumplimiento verificable en `/api/compliance`.
- [x] Script de auditoria reproducible `scripts/audit-project.sh`.
- [x] Guia de entregables y evaluacion `docs/ENTREGABLES_EVALUACION.md`.
- [x] Matriz de rubrica `docs/MATRIZ_RUBRICA.md`.

Accesos locales:

- Zabbix: http://localhost:8088
- Usuario: Admin
- Clave: zabbix
- MailHog: http://localhost:8025

Accesos publicos:

- Portal: https://web-zabbix.negociocontigo.com
- Zabbix: https://zabbix.negociocontigo.com
- MailHog: https://mailhog-zabbix.negociocontigo.com/login
