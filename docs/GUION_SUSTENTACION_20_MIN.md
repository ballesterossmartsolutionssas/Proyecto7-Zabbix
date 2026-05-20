# Guion de sustentación - 20 minutos

Ubicación de este archivo: `docs/GUION_SUSTENTACION_20_MIN.md`.

Versión corta para mandar al grupo: `entrega-final/GUION_PARA_ENVIAR_GRUPO.md`.

Este guion está pensado para enviarlo al grupo y que cada integrante sepa exactamente qué decir, qué diapositivas tomar y qué pantalla mostrar. La idea es que todos hablen, pero que Juan Camilo cierre con la parte más técnica: pruebas, Artillery, caída controlada, alertas y evidencias.

## Mensaje corto para el grupo

Equipo, la sustentación queda dividida así. La idea principal es que el proyecto no se vea como "solo CPU, memoria y disco", sino como una demo de observabilidad: servicios reales, carga, incidentes, SLO, alertas y recuperación.

- Luis Felipe: minutos 0 a 5. Problema, objetivo, alternativas y entregables.
- Juan Sebastián: minutos 5 a 10. Arquitectura Docker, servicios monitoreados e inventario.
- Daniela: minutos 10 a 15. Zabbix configurado, hosts, latest data, dashboard y alertas.
- Juan Camilo: minutos 15 a 20. Demo técnica en vivo: portal, Artillery, caída del servicio, MailHog, auditoría y cierre.

Cada uno debe estudiar su bloque, no leer todo literal y cerrar con la frase de transición para que el siguiente entre rápido. No explicar código línea por línea; solo mostrar archivo/pantalla y decir qué función cumple.

## Reparto por diapositivas

| Tiempo | Integrante | Diapositivas | Tema |
|---:|---|---:|---|
| 0:00 - 5:00 | Luis Felipe Murillo Matallana | 1 a 4 | Portada, problema, alternativas y objetivo |
| 5:00 - 10:00 | Juan Sebastián Delgado | 5 a 8 | Arquitectura lógica, despliegue en VPS, inventario e implementación Docker |
| 10:00 - 15:00 | Daniela Castro Quiñones | 9 a 12 | Dashboard, métricas, caída esperada y alertas |
| 15:00 - 20:00 | Juan Camilo Ballesteros Sierra | 13 a 18 | Carga, resultados, discusión, entregables, demo y cierre |

## 0:00 - 5:00 Luis Felipe

Mensaje central: el proyecto resuelve la falta de visibilidad sobre una infraestructura con varios servicios que pueden fallar sin aviso.

Diapositivas: 1, 2 y 3.

Guion sugerido:

1. "Buenos días. Nosotros somos el grupo del Proyecto 7: Monitoreo de infraestructura con Zabbix. El objetivo fue implementar una plataforma capaz de monitorear servicios reales desplegados con Docker."
2. "El problema es que una infraestructura puede tener el portal web funcionando parcialmente, pero fallar en base de datos, DNS o FTP. Si no hay monitoreo, la detección depende de revisión manual o del reporte del usuario."
3. "Por eso se planteó una solución con Zabbix 6.x, agentes, base de datos, Docker Compose y alertas por correo. La parte extra es que no dejamos el servicio web como una página estática: lo convertimos en una app para probar carga, incidentes, métricas, SLO y recuperación."
4. "Revisamos alternativas como Nagios, Prometheus y Datadog. Escogimos Zabbix porque integra agentes, frontend, triggers, dashboards, media types y API de aprovisionamiento en una sola plataforma."
5. "Como entregables dejamos informe IEEE, diapositivas, repositorio GitHub, README, evidencias y una demo pública con HTTPS."

Pantallas que puede mostrar:

- Diapositivas 1 a 3.
- README del repositorio si el profesor pregunta por entregables.

Frase de transición:

"Con el problema y el objetivo claros, Juan Sebastián continúa con la arquitectura y la infraestructura desplegada."

## 5:00 - 10:00 Juan Sebastián

Mensaje central: la solución cumple la infraestructura mínima exigida y queda totalmente empaquetada con Docker Compose.

Diapositivas: 5, 6, 7 y 8.

Guion sugerido:

1. "Primero separo dos ideas: arquitectura y despliegue. La arquitectura muestra qué componentes existen; el despliegue muestra dónde corren y cómo se publican."
2. "La arquitectura lógica tiene Zabbix Server, PostgreSQL, Zabbix Web, MailHog, el portal web con backend, MariaDB de demo, cuatro servicios monitoreados y cuatro agentes."
3. "El despliegue real está en una VPS Ubuntu de Hostinger. Caddy recibe los subdominios con HTTPS y Docker Compose mantiene los servicios internos en la red `proyecto7-monitoring`."
4. "No exponemos puertos internos directamente a Internet. Solo se publican tres entradas: portal web, Zabbix y MailHog; el resto queda privado dentro de Compose."
5. "El inventario en Zabbix queda así: `web-host` para HTTP, `db-host` para MariaDB, `dns-host` para CoreDNS y `ftp-host` para VSFTPD."
6. "También se cumple el requisito de imagen personalizada, porque el servidor Zabbix se construye desde `docker/zabbix-server/Dockerfile`, y las configuraciones se montan como volúmenes."

Pantallas que puede mostrar:

- Diapositivas 5 a 8.
- `docs/DIAGRAMAS_ARQUITECTURA_DESPLIEGUE.md`.
- `docker-compose.yml`.
- `docker-compose.vps.yml`.
- `docker/zabbix-server/Dockerfile`.

Frase de transición:

"Ya con la infraestructura montada, Daniela muestra cómo quedó configurado Zabbix para observar esos servicios."

## 10:00 - 15:00 Daniela

Mensaje central: Zabbix no solo está instalado; quedó configurado para mirar hosts, servicios, triggers, dashboard, alertas y endpoints de la aplicación.

Diapositivas: 7, 8 y 9.

Guion sugerido:

1. "En Zabbix se creó el grupo `Proyecto 7 - Infraestructura Docker`, donde están registrados los cuatro hosts monitoreados."
2. "El aprovisionamiento se automatizó con `scripts/provision_zabbix.py`. Ese script crea hosts, items, triggers, dashboard, media type de correo y web scenario."
3. "En Latest data se pueden revisar `agent.ping`, CPU, memoria, disco y checks de disponibilidad para HTTP, MySQL/MariaDB, DNS y FTP. Esto muestra la base del monitoreo."
4. "El dashboard permite ver el estado general de la infraestructura y las métricas históricas. La idea es mostrar que Zabbix sirve para operación, no solo para tener contenedores prendidos."
5. "Para alertas usamos MailHog como servidor SMTP de laboratorio. Así se valida que Zabbix genera correos de problema y recuperación sin enviar pruebas a correos reales."
6. "También existe un canal SMTP real del dominio como propuesta de escalamiento para un ambiente más parecido a producción."

Pantallas que puede mostrar:

- Diapositivas 7 a 9.
- Zabbix: `https://zabbix.negociocontigo.com`.
- Hosts del grupo del proyecto.
- Latest data.
- MailHog: `https://mailhog-zabbix.negociocontigo.com/login`.

Credenciales útiles:

- Zabbix: `Admin / MonitorUAO2026!`
- MailHog: `admin / MailUAO2026!`

Frase de transición:

"Con Zabbix y las alertas listas, Juan Camilo cierra con las pruebas en vivo y el valor agregado del proyecto."

## 15:00 - 20:00 Juan Camilo

Mensaje central: las pruebas demuestran el funcionamiento completo y el valor agregado por encima del mínimo: portal real, backend, gráficas, Artillery, auditoría y cumplimiento trazable.

Diapositivas: 10, 11, 12, 13 y 14.

Guion sugerido:

1. "Para ir más allá del requisito, el servicio web no es un index estático. Es una aplicación Node.js con frontend, backend, MariaDB, endpoints JSON, telemetría, incidentes, gráficas, SLO y exporter `/metrics`. Eso permite hacer pruebas de verdad."
2. "Aquí se ve el portal público: `https://web-zabbix.negociocontigo.com`. Esta pantalla sirve como consola de demo: estado, plan de prueba, carga, base de datos, analíticas y cumplimiento."
3. "La matriz `/api/compliance` cruza los requisitos del enunciado contra evidencias concretas. Esto ayuda a sustentar que se cumplió Docker Compose, cuatro hosts, MailHog, dashboard, triggers, pruebas y documentación."
4. "Ahora ejecuto Artillery para generar tráfico real contra el frontend y la API. Esto permite observar comportamiento bajo carga, no solamente disponibilidad básica."

Comando de Artillery:

```bash
cd /root/proyecto7-zabbix
artillery run tests/artillery-live-demo.yml
```

Mientras corre Artillery:

- Mostrar la consola de pruebas guiadas en el portal.
- Mostrar rutas golpeadas.
- Mostrar SLO y gráficas.
- Decir: "Si el tráfico aumenta y los endpoints responden, podemos diferenciar disponibilidad normal de degradación por carga."

5. "La segunda prueba es simular la caída del servicio web. Zabbix debe detectar que HTTP no responde, abrir un problema y luego registrar recuperación cuando se restaure."

Comandos de caída:

```bash
cd /root/proyecto7-zabbix
docker compose -f docker-compose.vps.yml stop web-service
sleep 90
docker compose -f docker-compose.vps.yml start web-service
```

Si Zabbix tarda:

- Mostrar evidencia previa en `entrega-final/evidencias/06_zabbix_falla_web_activa.png`.
- Mostrar MailHog con correos de problema y recuperación.
- Decir: "Zabbix trabaja por intervalos de chequeo; por eso la detección puede tardar unos segundos, pero el evento queda en histórico."

6. "Finalmente ejecuto la auditoría automática. Esta auditoría valida Compose, endpoints públicos, matriz de cumplimiento y objetos principales de Zabbix."

Comando de auditoría:

```bash
bash scripts/audit-project.sh
```

Resultado esperado:

- Auditoría con 0 fallas.
- Artillery con 0 usuarios fallidos.
- `/api/compliance` mostrando cumplimiento completo.
- Problema y recuperación visibles en Zabbix/MailHog.

Frase final:

"En conclusión, el proyecto cumple los requisitos: Docker Compose, mínimo cuatro hosts monitoreados, Zabbix Server con base de datos, frontend web, triggers, dashboards, alertas por correo, pruebas de caída y métricas históricas. Además, agregamos una aplicación real con backend, gráficas, SLO, `/metrics`, Artillery y auditoría reproducible para sustentar el valor agregado."

## Orden recomendado de ventanas antes de presentar

Abrir antes de empezar para no perder tiempo:

- Diapositivas: `entrega-final/Presentacion_Proyecto7_Zabbix.pptx`.
- Portal: `https://web-zabbix.negociocontigo.com`.
- Zabbix: `https://zabbix.negociocontigo.com`.
- MailHog: `https://mailhog-zabbix.negociocontigo.com/login`.
- Terminal SSH en `/root/proyecto7-zabbix`.
- Repositorio GitHub: `https://github.com/ballesterossmartsolutionssas/Proyecto7-Zabbix`.

## Reglas para que salga limpio

- Nadie debe pasarse de 5 minutos.
- No leer el informe; hablar con base en las diapositivas.
- No explicar código línea por línea.
- Si una demo tarda, mostrar evidencia previa y seguir con la explicación.
- Juan Camilo debe tener la terminal lista antes de iniciar.
- Dejar Zabbix y MailHog logueados antes de presentar.
- Si preguntan por correos reales, responder: "MailHog captura correos de laboratorio; para producción dejamos documentado el canal SMTP del dominio como escalamiento."
