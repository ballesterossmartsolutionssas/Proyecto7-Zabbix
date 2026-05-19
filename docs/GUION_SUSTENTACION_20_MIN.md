# Guion de sustentacion - 20 minutos

Objetivo: que cada integrante hable 5 minutos y que la demostracion cubra problema, diseno, implementacion, pruebas y valor agregado sin repetir.

## Reparto rapido

| Tiempo | Integrante | Bloque | Pantallas principales |
|---:|---|---|---|
| 0:00 - 5:00 | Juan Camilo Ballesteros Sierra | Problema, objetivo, arquitectura y Docker Compose | Presentacion, README, diagrama, `docker-compose.yml` |
| 5:00 - 10:00 | Luis Felipe Murillo Matallana | Zabbix Server, base de datos, frontend y aprovisionamiento | Zabbix UI, `scripts/provision_zabbix.py`, hosts/grupo |
| 10:00 - 15:00 | Juan Sebastian Delgado | Hosts monitoreados, agentes, checks, metricas y graficas | Zabbix Latest data, dashboard, `web-host`, `db-host`, `dns-host`, `ftp-host` |
| 15:00 - 20:00 | Daniela Castro Quinones | Pruebas, alertas, Artillery, MailHog, evidencias y cierre | Portal web, Load Lab, MailHog, `/api/compliance`, auditoria |

## 0:00 - 5:00 Juan Camilo

Mensaje central: el proyecto resuelve la necesidad de observar una infraestructura de servicios antes de que el usuario final reporte la falla.

1. Presentar el problema:
   - Una red con web, base de datos, DNS y FTP puede fallar por caidas de servicio, saturacion o conectividad.
   - Sin monitoreo centralizado, la deteccion es manual y lenta.

2. Presentar objetivo:
   - Implementar monitoreo con Zabbix 6.x.
   - Usar Docker Compose para que el despliegue sea reproducible.
   - Generar alertas y evidencias historicas.

3. Mostrar arquitectura:
   - Zabbix Server.
   - PostgreSQL.
   - Zabbix Web.
   - MailHog.
   - Cuatro servicios monitoreados.
   - Agentes Zabbix por host.

4. Mostrar Docker:
   - `docker-compose.yml`.
   - `docker-compose.vps.yml`.
   - Imagen personalizada `docker/zabbix-server/Dockerfile`.
   - Volumenes de configuracion Zabbix.

Frase de cierre: "Con esto dejamos la base reproducible; ahora se explica como Zabbix queda configurado y automatizado."

## 5:00 - 10:00 Luis Felipe

Mensaje central: Zabbix no quedo manual, se aprovisiona por API y queda conectado a base de datos, frontend, triggers y notificaciones.

1. Mostrar Zabbix Web:
   - URL: `https://zabbix.negociocontigo.com`.
   - Grupo: `Proyecto 7 - Infraestructura Docker`.

2. Explicar base de datos:
   - PostgreSQL para Zabbix.
   - MariaDB para la app monitoreada.

3. Explicar aprovisionamiento:
   - `scripts/provision_zabbix.py`.
   - Crea grupo, hosts, items, triggers, dashboard, media type y web scenario.

4. Mostrar configuracion avanzada:
   - `Exporter /metrics Proyecto 7`.
   - `Estado MariaDB desde API Proyecto 7`.
   - Web scenario `Proyecto 7 - recorrido publico`.

5. Mostrar frontend y backend:
   - Portal: `https://web-zabbix.negociocontigo.com`.
   - Endpoints: `/health`, `/api/summary`, `/api/db/status`, `/metrics`.

Frase de cierre: "Ya con Zabbix configurado, pasamos a los hosts monitoreados y a las metricas que exige el enunciado."

## 10:00 - 15:00 Juan Sebastian

Mensaje central: se monitorean los cuatro servicios pedidos, con agente, estado de servicio y metricas historicas.

1. Mostrar inventario:
   - `web-host`: portal HTTP.
   - `db-host`: MariaDB.
   - `dns-host`: CoreDNS.
   - `ftp-host`: VSFTPD.

2. Mostrar agentes:
   - `web-agent`.
   - `db-agent`.
   - `dns-agent`.
   - `ftp-agent`.

3. Mostrar Latest data:
   - `agent.ping`.
   - CPU.
   - Memoria.
   - Disco.
   - Disponibilidad HTTP, MySQL, DNS y FTP.

4. Mostrar graficas:
   - Graficas historicas en Zabbix.
   - Centro de graficas del portal: CPU, memoria, disco, rutas, cargas y SLO.

5. Explicar triggers:
   - Servicio no responde.
   - Host sin datos.
   - Recorrido publico lento o fallido.

Frase de cierre: "Con los datos y triggers listos, cerramos demostrando pruebas, carga, caida y alertas."

## 15:00 - 20:00 Daniela

Mensaje central: las pruebas demuestran que la solucion funciona y que va mas alla del requisito minimo.

1. Mostrar portal:
   - Load Lab en vivo.
   - Centro de graficas.
   - Matriz de cumplimiento.

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

