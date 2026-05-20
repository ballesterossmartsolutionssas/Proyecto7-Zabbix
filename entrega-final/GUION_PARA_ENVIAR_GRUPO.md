# Guion corto para enviar al grupo

Equipo, la sustentación dura máximo 20 minutos. La idea principal es que no se vea como un proyecto limitado a CPU, memoria y disco. Vamos a venderlo como una plataforma de observabilidad: Zabbix monitorea servicios reales, la web permite generar carga, se guardan incidentes en MariaDB, hay SLO, gráficas, `/metrics`, alertas en MailHog y auditoría reproducible.

## Reparto

| Tiempo | Integrante | Qué dice |
|---:|---|---|
| 0:00 - 5:00 | Luis Felipe | Problema, alternativas, decisión por Zabbix y objetivo. |
| 5:00 - 10:00 | Juan Sebastián | Arquitectura lógica, despliegue en VPS, servicios monitoreados e inventario. |
| 10:00 - 15:00 | Daniela | Zabbix configurado, Latest data, dashboard y alertas con MailHog. |
| 15:00 - 20:00 | Juan Camilo | Demo técnica: portal, Artillery, caída, MailHog, auditoría y cierre. |

## Qué debe mostrar cada uno

Luis Felipe:
- Explica que el problema es enterarse tarde de una caída.
- Dice que Zabbix centraliza monitoreo, eventos, históricos y alertas.
- Remarca que el valor extra es una app real para probar carga, SLO e incidentes.

Juan Sebastián:
- Muestra las diapositivas de arquitectura lógica y despliegue en VPS.
- Muestra `docker-compose.yml`, `docker-compose.vps.yml` y el Dockerfile de Zabbix.
- Explica los 4 hosts: web, DB, DNS y FTP.
- Dice que cada host tiene agente y checks de disponibilidad.
- Frase clave: "No exponemos los puertos internos; Caddy publica HTTPS y Docker Compose aísla la red de monitoreo."

Daniela:
- Entra a Zabbix.
- Muestra grupo, hosts, Latest data, dashboard y alertas.
- Explica que MailHog captura correos de problema y recuperación sin enviar spam real.

Juan Camilo:
- Abre `https://web-zabbix.negociocontigo.com`.
- Muestra la consola de demo: estado, plan de observabilidad, carga, DB, gráficas y matriz.
- Ejecuta:

```bash
cd /root/proyecto7-zabbix
artillery run tests/artillery-live-demo.yml
```

- Si se hace prueba de caída:

```bash
docker compose -f docker-compose.vps.yml stop web-service
sleep 90
docker compose -f docker-compose.vps.yml start web-service
```

- Cierra con:

```bash
bash scripts/audit-project.sh
```

Frase final:

"El proyecto cumple lo pedido: Docker Compose, Zabbix Server, cuatro hosts, agentes, dashboards, triggers, alertas, caída controlada y métricas históricas. Además, se llevó más allá con una aplicación real, backend, MariaDB, SLO, `/metrics`, Artillery, analíticas y auditoría reproducible."

## Accesos

- Web demo: https://web-zabbix.negociocontigo.com
- Zabbix: https://zabbix.negociocontigo.com
- MailHog: https://mailhog-zabbix.negociocontigo.com/login
- Repo: https://github.com/ballesterossmartsolutionssas/Proyecto7-Zabbix
