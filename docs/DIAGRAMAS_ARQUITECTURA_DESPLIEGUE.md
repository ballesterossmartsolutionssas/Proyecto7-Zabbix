# Diagramas de arquitectura y despliegue

Este documento soporta dos preguntas típicas de sustentación:

- Arquitectura: qué componentes componen la solución y cómo se relacionan.
- Despliegue: dónde corre la solución, qué se publica a Internet y qué queda interno.

## Diagrama de arquitectura lógica

```mermaid
flowchart LR
    Profesor["Profesor / grupo"] --> Portal["Portal web de demo<br/>frontend + backend Node.js"]
    Profesor --> ZabbixWeb["Zabbix Web<br/>dashboard + problems + latest data"]
    Profesor --> MailhogUI["MailHog UI<br/>correos de laboratorio"]

    Portal --> API["API REST<br/>/health /api/live /api/compliance /metrics"]
    API --> MariaDemo[("MariaDB demo<br/>telemetría e incidentes")]

    ZabbixWeb --> ZabbixServer["Zabbix Server 6.x<br/>items + triggers + actions"]
    ZabbixServer --> Postgres[("PostgreSQL<br/>histórico Zabbix")]
    ZabbixServer --> MailhogSMTP["MailHog SMTP<br/>captura alertas"]
    MailhogSMTP --> MailhogUI

    ZabbixServer --> WebAgent["web-agent"]
    ZabbixServer --> DBAgent["db-agent"]
    ZabbixServer --> DNSAgent["dns-agent"]
    ZabbixServer --> FTPAgent["ftp-agent"]

    WebAgent --> WebService["web-service<br/>HTTP + API + métricas"]
    DBAgent --> DBService["db-service<br/>MariaDB 3306"]
    DNSAgent --> DNSService["dns-service<br/>CoreDNS 53"]
    FTPAgent --> FTPService["ftp-service<br/>VSFTPD 21"]

    WebService --> DBService
```

## Diagrama de despliegue en VPS

```mermaid
flowchart TB
    Internet["Internet"] --> DNS["DNS negociocontigo.com"]
    DNS --> WebDNS["web-zabbix.negociocontigo.com"]
    DNS --> ZabbixDNS["zabbix.negociocontigo.com"]
    DNS --> MailDNS["mailhog-zabbix.negociocontigo.com"]

    subgraph VPS["Hostinger VPS - Ubuntu 24.04<br/>187.124.228.23"]
        subgraph CaddyNet["Red externa: negociocontigo_default"]
            Caddy["Caddy<br/>reverse proxy + HTTPS"]
        end

        subgraph Compose["Docker Compose: /root/proyecto7-zabbix<br/>docker-compose.vps.yml"]
            subgraph ProjectNet["Red interna: proyecto7-monitoring"]
                Web["web-service<br/>Node.js frontend/backend"]
                ZabbixWeb["zabbix-web<br/>frontend Zabbix"]
                Gate["mailhog-gate<br/>login simple"]
                Mailhog["mailhog<br/>SMTP + inbox"]
                Server["zabbix-server<br/>imagen personalizada"]
                Pg[("postgres<br/>BD Zabbix")]
                DemoDB[("db-service<br/>MariaDB demo")]
                DNSService["dns-service<br/>CoreDNS"]
                FTPService["ftp-service<br/>VSFTPD"]
                Agents["4 Zabbix agents<br/>web/db/dns/ftp"]
            end
        end
    end

    WebDNS --> Caddy
    ZabbixDNS --> Caddy
    MailDNS --> Caddy

    Caddy --> Web
    Caddy --> ZabbixWeb
    Caddy --> Gate
    Gate --> Mailhog

    ZabbixWeb --> Server
    Server --> Pg
    Server --> Agents
    Server --> Mailhog
    Web --> DemoDB
    Agents --> Web
    Agents --> DemoDB
    Agents --> DNSService
    Agents --> FTPService
```

## Cómo explicarlo si el profesor pregunta

- La arquitectura lógica muestra los componentes: Zabbix, base de datos, agentes, servicios monitoreados, MailHog y portal de pruebas.
- El despliegue muestra la instalación real: una VPS Ubuntu en Hostinger, Docker Compose, redes internas y Caddy como proxy HTTPS.
- Los puertos internos no se exponen directamente a Internet. Se publican solo tres entradas HTTPS: portal web, Zabbix y MailHog.
- Zabbix Server queda en la red interna, consulta agentes y servicios, guarda histórico en PostgreSQL y envía alertas SMTP hacia MailHog.
- El portal web aporta el valor extra: backend real, MariaDB, endpoints JSON, `/metrics`, analíticas y carga con Artillery.
