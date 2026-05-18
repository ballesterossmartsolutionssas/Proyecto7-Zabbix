# Guia de sustentacion - Proyecto 7

Tiempo maximo: 20 minutos.

## Distribucion sugerida

1. Presentacion del problema - 2 min
   - Necesidad de observar disponibilidad, recursos y servicios.
   - Riesgo de fallas sin monitoreo centralizado.

2. Arquitectura - 4 min
   - Zabbix Server con PostgreSQL.
   - Zabbix Web para visualizacion.
   - Cuatro servicios monitoreados: web, base de datos, DNS y FTP.
   - Agentes Zabbix y checks de servicios.
   - MailHog como servidor SMTP de pruebas.

3. Implementacion Docker - 4 min
   - Explicar `docker-compose.yml`.
   - Mostrar la imagen personalizada `proyecto7-zabbix-server:6.0-custom` creada con `docker/zabbix-server/Dockerfile`.
   - Mostrar los volumenes de configuracion Zabbix montados para servidor y agentes.
   - Red interna `proyecto7-monitoring`.
   - Volumen persistente de PostgreSQL.
   - Variables en `.env`.

4. Demostracion - 7 min
   - Mostrar hosts y latest data.
   - Mostrar dashboard o graficas.
   - Abrir `https://web-zabbix.negociocontigo.com` y crear un incidente demo.
   - Mostrar `/api/db/status`, `/api/slo`, `/api/incidents` y `/metrics`.
   - Ejecutar `artillery run tests/artillery-live-demo.yml` con el panel `Load Lab en vivo` abierto.
   - Mostrar como suben requests, telemetria, cargas y SLO durante la ejecucion.
   - Mostrar el `Centro de graficas` con CPU, memoria, disco, rutas y cargas recientes.
   - Mostrar el web scenario `Proyecto 7 - recorrido publico` en Zabbix.
   - Detener un servicio con `test-failure.ps1`.
   - Ver problema en Zabbix.
   - Ver correo en MailHog.
   - Restaurar servicio y mostrar recuperacion.

5. Conclusiones - 3 min
   - Zabbix centraliza visibilidad operativa.
   - Triggers permiten reaccionar ante fallas.
   - MailHog valida el flujo de alertas y el canal SMTP real demuestra escalamiento externo.
   - La app monitoreada tiene backend, frontend, persistencia e endpoints de carga para pruebas de estres.
   - El SLO y el paquete de evidencias permiten explicar disponibilidad y resultados de forma verificable.
   - Docker Compose hace reproducible el despliegue.

## Reparto por integrante

- Juan Camilo Ballesteros Sierra: arquitectura general y Docker Compose.
- Luis Felipe Murillo Matallana: configuracion de Zabbix Server, frontend y base de datos.
- Juan Sebastian Delgado: hosts monitoreados, agentes y checks.
- Daniela Castro Quinones: pruebas, alertas MailHog y documentacion.
