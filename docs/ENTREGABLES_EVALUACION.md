# Entregables y evaluacion - Proyecto 7

Fecha de entrega: martes 19 de mayo de 2026.

Grupo: LISTA 3 - Monitoreo de infraestructura.

Integrantes:

- Juan Camilo Ballesteros Sierra
- Luis Felipe Murillo Matallana
- Juan Sebastian Delgado
- Daniela Castro Quinones

## Entregables a subir al curso

| Entregable solicitado | Archivo o enlace final | Estado |
|---|---|---|
| Informe IEEE, maximo 7 paginas | `entrega-final/Informe_IEEE_Proyecto7_Zabbix.pdf` | Listo |
| Informe editable | `entrega-final/Informe_IEEE_Proyecto7_Zabbix.docx` | Listo |
| Diapositivas en repositorio GitHub | `entrega-final/Presentacion_Proyecto7_Zabbix.pptx` | Listo |
| Repositorio GitHub con configuracion y aprovisionamiento | `https://github.com/ballesterossmartsolutionssas/Proyecto7-Zabbix` | Listo |
| README con paso a paso, inventario y URLs | `README.md` | Listo |
| Evidencias de pruebas | `entrega-final/evidencias/` y `entrega-final/auditoria-*/` | Listo |
| Paquete comprimido de respaldo | `entrega-final/Proyecto7_Zabbix_entrega_final.zip` | Listo |

## Accesos de sustentacion

| Componente | URL | Credenciales |
|---|---|---|
| Portal monitoreado | `https://web-zabbix.negociocontigo.com` | Publico |
| Zabbix Web | `https://zabbix.negociocontigo.com` | `Admin / MonitorUAO2026!` |
| MailHog | `https://mailhog-zabbix.negociocontigo.com/login` | `admin / MailUAO2026!` |
| Repositorio | `https://github.com/ballesterossmartsolutionssas/Proyecto7-Zabbix` | Publico segun visibilidad del repo |

## Paso a paso para sustentar en 20 minutos

1. Abrir el portal publico y mostrar inventario, backend, Load Lab, Centro de graficas y Matriz de cumplimiento.
2. Abrir Zabbix y mostrar el grupo `Proyecto 7 - Infraestructura Docker`.
3. Mostrar hosts `web-host`, `db-host`, `dns-host` y `ftp-host` con items de CPU, memoria, disco, ping y servicios.
4. Ejecutar carga controlada:

   ```bash
   cd /root/proyecto7-zabbix
   artillery run tests/artillery-live-demo.yml
   ```

5. Mientras corre la carga, mostrar cambios en `/api/live`, `/api/charts`, `/metrics` y Zabbix Latest data.
6. Simular caida:

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

## Comandos de validacion antes de entregar

```bash
cd /root/proyecto7-zabbix
bash scripts/audit-project.sh
bash scripts/evidence-pack.sh
artillery run tests/artillery-smoke.yml
```

Resultado esperado:

- Matriz `/api/compliance`: `100%`.
- Auditoria: `0` validaciones fallidas.
- Artillery smoke: `0` usuarios fallidos.
- Zabbix: hosts disponibles, triggers configurados y graficas historicas con datos.

