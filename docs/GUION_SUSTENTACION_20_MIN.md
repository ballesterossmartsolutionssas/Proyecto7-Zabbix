# Guion de sustentacion - 20 minutos

Objetivo: que cada integrante hable 5 minutos y que la demostracion cubra problema, diseno, implementacion, pruebas y valor agregado sin repetir.

## Reparto rapido

| Tiempo | Integrante | Bloque | Pantallas principales |
|---:|---|---|---|
| 0:00 - 5:00 | Luis Felipe Murillo Matallana | Problema, objetivo y contexto | Presentacion, informe, README |
| 5:00 - 10:00 | Juan Sebastian Delgado | Arquitectura, Docker e inventario | Diagrama, `docker-compose.yml`, servicios monitoreados |
| 10:00 - 15:00 | Daniela Castro Quinones | Zabbix configurado, dashboards y alertas | Zabbix UI, hosts, latest data, MailHog |
| 15:00 - 20:00 | Juan Camilo Ballesteros Sierra | Demo tecnica: pruebas, Artillery, caida, evidencias y cierre | Portal web, Load Lab, `/api/compliance`, auditoria, Zabbix/MailHog |

## 0:00 - 5:00 Luis Felipe

Mensaje central: el proyecto resuelve la necesidad de observar una infraestructura de servicios antes de que el usuario final reporte la falla.

1. Presentar el problema:
   - Una red con web, base de datos, DNS y FTP puede fallar por caidas de servicio, saturacion o conectividad.
   - Sin monitoreo centralizado, la deteccion es manual y lenta.

2. Presentar objetivo:
   - Implementar monitoreo con Zabbix 6.x.
   - Usar Docker Compose para que el despliegue sea reproducible.
   - Generar alertas y evidencias historicas.

3. Comparar alternativa:
   - Prometheus, Nagios, Datadog y Zabbix.
   - Zabbix se escogio porque integra agentes, frontend, triggers, dashboards y alertas.

4. Mostrar entregables:
   - Informe IEEE.
   - Presentacion.
   - Repositorio GitHub.
   - README con paso a paso.

Frase de cierre: "Con el problema y el objetivo claros, pasamos a la arquitectura y a los servicios desplegados."

## 5:00 - 10:00 Juan Sebastian

Mensaje central: la solucion esta dockerizada y cumple la infraestructura minima pedida: web, base de datos, DNS y FTP.

1. Mostrar arquitectura:
   - Zabbix Server.
   - PostgreSQL.
   - Zabbix Web.
   - MailHog.
   - Cuatro servicios monitoreados.
   - Agentes Zabbix por host.

2. Mostrar Docker:
   - `docker-compose.yml`.
   - `docker-compose.vps.yml`.
   - Imagen personalizada `docker/zabbix-server/Dockerfile`.
   - Volumenes de configuracion Zabbix.

3. Mostrar inventario:
   - `web-host`: portal HTTP.
   - `db-host`: MariaDB.
   - `dns-host`: CoreDNS.
   - `ftp-host`: VSFTPD.

4. Mostrar agentes:
   - `web-agent`.
   - `db-agent`.
   - `dns-agent`.
   - `ftp-agent`.

5. Explicar red:
   - Red interna Docker.
   - Resolucion por nombre de servicio.
   - Publicacion HTTPS mediante Caddy en la VPS.

Frase de cierre: "Con la infraestructura lista, pasamos a ver como Zabbix la monitorea."

## 10:00 - 15:00 Daniela

Mensaje central: Zabbix quedo configurado con hosts, templates, items, triggers, dashboards y alertas.

1. Mostrar Zabbix Web:
   - URL: `https://zabbix.negociocontigo.com`.
   - Grupo: `Proyecto 7 - Infraestructura Docker`.

2. Explicar base de datos:
   - PostgreSQL para Zabbix.
   - MariaDB para la app monitoreada.

3. Explicar aprovisionamiento:
   - `scripts/provision_zabbix.py`.
   - Crea grupo, hosts, items, triggers, dashboard, media type y web scenario.

4. Mostrar Latest data:
   - `agent.ping`.
   - CPU.
   - Memoria.
   - Disco.
   - Disponibilidad HTTP, MySQL, DNS y FTP.

5. Mostrar dashboards y alertas:
   - Dashboard Zabbix.
   - Web scenario `Proyecto 7 - recorrido publico`.
   - MailHog como receptor de correos de prueba.

Frase de cierre: "Ya se vio la plataforma funcionando; Juan Camilo cierra con las pruebas en vivo y el valor agregado."

## 15:00 - 20:00 Juan Camilo

Mensaje central: las pruebas demuestran que la solucion funciona y que va mas alla del requisito minimo.

1. Mostrar portal publico:
   - Load Lab en vivo.
   - Centro de graficas.
   - Matriz de cumplimiento.
   - Endpoints `/api/live`, `/api/charts`, `/api/compliance`, `/metrics`.

2. Ejecutar Artillery:

   ```bash
   cd /root/proyecto7-zabbix
   artillery run tests/artillery-live-demo.yml
   ```

   Mostrar que suben requests, telemetria, cargas y SLO.

3. Simular caida:

   ```bash
   docker compose -f docker-compose.vps.yml stop web-service
   sleep 90
   docker compose -f docker-compose.vps.yml start web-service
   ```

   Mostrar problema y recuperacion en Zabbix.

4. Mostrar MailHog:
   - URL: `https://mailhog-zabbix.negociocontigo.com/login`.
   - Usuario: `admin`.
   - Clave: `MailUAO2026!`.
   - Evidenciar correo de problema y recuperacion.

5. Cierre con auditoria:

   ```bash
   bash scripts/audit-project.sh
   ```

   Resultado esperado:
   - Matriz `/api/compliance`: `100%`.
   - Auditoria: `0` fallas.
   - Artillery: `0` usuarios fallidos.

Frase final: "El proyecto cumple el despliegue Docker, monitoreo de cuatro servicios, dashboards, alertas, metricas historicas y agrega una aplicacion real con pruebas de carga y auditoria verificable."

## Reglas para no pasarse de tiempo

- Cada integrante debe cerrar en el minuto 5 exacto.
- No explicar codigo linea por linea; mostrar archivo y resumir su funcion.
- Si Artillery tarda, seguir hablando mientras corre.
- Si la caida demora en Zabbix, mostrar evidencias previas y MailHog.
- Dejar las credenciales abiertas antes de iniciar para no perder tiempo.
