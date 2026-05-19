# Entregables y evaluacion - Proyecto 7

Fecha de entrega: martes 19 de mayo de 2026.

Grupo: LISTA 3 - Monitoreo de infraestructura.

Integrantes:

- Juan Camilo Ballesteros Sierra
- Luis Felipe Murillo Matallana
- Juan Sebastián Delgado
- Daniela Castro Quiñones

## Entregables a subir al curso

| Entregable solicitado | Archivo o enlace final | Estado |
|---|---|---|
| Informe IEEE, máximo 7 páginas | `entrega-final/Informe_IEEE_Proyecto7_Zabbix.pdf` | Listo |
| Informe editable | `entrega-final/Informe_IEEE_Proyecto7_Zabbix.docx` | Listo |
| Diapositivas en repositorio GitHub | `entrega-final/Presentacion_Proyecto7_Zabbix.pptx` | Listo |
| Repositorio GitHub con configuración y aprovisionamiento | `https://github.com/ballesterossmartsolutionssas/Proyecto7-Zabbix` | Listo |
| README con paso a paso, inventario y URLs | `README.md` | Listo |
| Evidencias de pruebas | `entrega-final/evidencias/` y `entrega-final/auditoria-*/` | Listo |
| Paquete comprimido de respaldo | `entrega-final/Proyecto7_Zabbix_entrega_final.zip` | Listo |

## Accesos de sustentacion

| Componente | URL | Credenciales |
|---|---|---|
| Portal monitoreado | `https://web-zabbix.negociocontigo.com` | Público |
| Zabbix Web | `https://zabbix.negociocontigo.com` | `Admin / MonitorUAO2026!` |
| MailHog | `https://mailhog-zabbix.negociocontigo.com/login` | `admin / MailUAO2026!` |
| Repositorio | `https://github.com/ballesterossmartsolutionssas/Proyecto7-Zabbix` | Público segun visibilidad del repo |

## Paso a paso para sustentar en 20 minutos

Division por integrante:

| Integrante | Tiempo | Responsabilidad |
|---|---:|---|
| Luis Felipe Murillo Matallana | 0:00 - 5:00 | Problema, objetivo, contexto y entregables |
| Juan Sebastián Delgado | 5:00 - 10:00 | Arquitectura, Docker Compose, inventario y agentes |
| Daniela Castro Quiñones | 10:00 - 15:00 | Zabbix configurado, dashboard, latest data y alertas |
| Juan Camilo Ballesteros Sierra | 15:00 - 20:00 | Pruebas, Artillery, caída, MailHog, evidencias y cierre |

Guion detallado: `docs/GUION_SUSTENTACION_20_MIN.md`.

1. Abrir el portal público y mostrar estado en vivo, plan de observabilidad, pruebas guiadas, analíticas y Matriz de cumplimiento.
2. Abrir Zabbix y mostrar el grupo `Proyecto 7 - Infraestructura Docker`.
3. Mostrar hosts `web-host`, `db-host`, `dns-host` y `ftp-host` con items de CPU, memoria, disco, ping y servicios.
4. Ejecutar carga controlada:

   ```bash
   cd /root/proyecto7-zabbix
   artillery run tests/artillery-live-demo.yml
   ```

5. Mientras corre la carga, mostrar cambios en `/api/live`, `/api/charts`, `/metrics` y Zabbix Latest data.
6. Simular caída:

   ```bash
   docker compose -f docker-compose.vps.yml stop web-service
   sleep 90
   docker compose -f docker-compose.vps.yml start web-service
   ```

7. Mostrar problema y recuperacion en Zabbix.
8. Abrir MailHog y evidenciar correos de problema/recuperacion.
9. Cerrar con el reporte de auditoria:

   ```bash
   bash scripts/audit-project.sh
   ```

## Comandos de validación antes de entregar

```bash
cd /root/proyecto7-zabbix
bash scripts/audit-project.sh
bash scripts/evidence-pack.sh
artillery run tests/artillery-smoke.yml
```

Resultado esperado:

- Matriz `/api/compliance`: `100%`.
- Auditoria: `0` validaciónes fallidas.
- Artillery smoke: `0` usuarios fallidos.
- Zabbix: hosts disponibles, triggers configurados y gráficas historicas con datos.
