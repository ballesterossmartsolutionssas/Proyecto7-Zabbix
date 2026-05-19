# Presentacion - Proyecto 7

## Diapositiva 1 - Portada

Proyecto 7: Monitoreo de infraestructura con Zabbix.

Integrantes:

- Juan Camilo Ballesteros Sierra
- Luis Felipe Murillo Matallana
- Juan Sebastian Delgado
- Daniela Castro Quinones

## Diapositiva 2 - Problema

Una infraestructura con varios servicios puede fallar sin aviso. Se necesita visibilidad sobre disponibilidad, recursos, estado de servicios y alertas para reducir el tiempo de deteccion.

## Diapositiva 3 - Objetivo

Implementar una plataforma de monitoreo con Zabbix 6.x, Docker Compose, cuatro servicios monitoreados y notificaciones de alerta mediante MailHog. Como valor agregado, publicar la solucion con HTTPS y monitorear una aplicacion real con backend, base de datos, graficas, SLO y pruebas de carga.

## Diapositiva 4 - Arquitectura

Componentes:

- Zabbix Server.
- PostgreSQL.
- Zabbix Web.
- MailHog.
- Servicios HTTP, MySQL/MariaDB, DNS y FTP.
- Agentes Zabbix.
- Portal publico `web-zabbix.negociocontigo.com`.
- Backend Node.js con MariaDB, `/metrics`, `/api/charts`, `/api/live` y `/api/compliance`.

## Diapositiva 5 - Servicios monitoreados

| Host | Servicio | Puerto |
|---|---|---|
| web-host | HTTP | 80 |
| db-host | MySQL/MariaDB | 3306 |
| dns-host | DNS | 53 |
| ftp-host | FTP | 21 |

## Diapositiva 6 - Implementacion Docker

Todo se despliega con `docker compose up -d`. Los servicios comparten la red interna `proyecto7-monitoring` y la base de datos de Zabbix usa volumen persistente. El servidor usa imagen personalizada construida desde `docker/zabbix-server/Dockerfile`.

## Diapositiva 7 - Configuracion Zabbix

El script de aprovisionamiento crea grupo de hosts, hosts, items de disponibilidad, triggers de falla y media type de correo apuntando a MailHog. Tambien se montan configuraciones Zabbix como volumen para servidor y agentes.

## Diapositiva 8 - Dashboard y metricas

Mostrar en Zabbix:

- Disponibilidad de agentes.
- CPU, memoria y disco.
- Estado de HTTP, MySQL, DNS y FTP.
- Graficas historicas.

## Diapositiva 9 - Prueba de caida

Comando:

```powershell
.\scripts\test-failure.ps1 -Service web-service -Seconds 90
```

Resultado esperado: aparece problema en Zabbix y se resuelve al restaurar el contenedor.

## Diapositiva 10 - Alertas con MailHog

MailHog recibe los correos de prueba enviados por Zabbix, permitiendo validar notificaciones sin usar un proveedor externo.

## Diapositiva 11 - Resultados

La solucion detecta servicios caidos, centraliza eventos, muestra datos historicos y permite demostrar recuperacion despues de una falla. La auditoria automatica valida la matriz de cumplimiento del enunciado y Artillery evidencia comportamiento bajo carga.

## Diapositiva 12 - Valor agregado

- Despliegue HTTPS en VPS.
- Portal con frontend y backend real.
- Persistencia de telemetria e incidentes en MariaDB.
- Graficas operativas y SLO.
- Pruebas Artillery en vivo.
- Matriz de cumplimiento `/api/compliance`.
- Auditoria reproducible `scripts/audit-project.sh`.

## Diapositiva 13 - Entregables

- Informe IEEE: `entrega-final/Informe_IEEE_Proyecto7_Zabbix.pdf`.
- Presentacion: `entrega-final/Presentacion_Proyecto7_Zabbix.pptx`.
- Repositorio GitHub con Docker Compose, scripts y README.
- Evidencias: `entrega-final/evidencias/` y `entrega-final/auditoria-*/`.

## Diapositiva 14 - Conclusiones

Zabbix permite monitorear infraestructura dockerizada de forma reproducible. Los triggers y dashboards facilitan respuesta ante incidentes y analisis del comportamiento de servicios.
