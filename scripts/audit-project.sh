#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://web-zabbix.negociocontigo.com}"
ZABBIX_API_URL="${ZABBIX_API_URL:-http://127.0.0.1:8088/api_jsonrpc.php}"
ZABBIX_USER="${ZABBIX_USER:-Admin}"
ZABBIX_PASSWORD="${ZABBIX_PASSWORD:-MonitorUAO2026!}"
OUT_DIR="${OUT_DIR:-entrega-final/auditoria-$(date -u +%Y%m%dT%H%M%SZ)}"

mkdir -p "$OUT_DIR"

pass=0
fail=0

record() {
  local status="$1"
  local name="$2"
  local detail="$3"
  if [ "$status" = "OK" ]; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
  fi
  printf '| %s | %s | %s |\n' "$status" "$name" "$detail" >> "$OUT_DIR/reporte-cumplimiento.md"
}

json_get() {
  local name="$1"
  local path="$2"
  curl -fsS "$BASE_URL$path" -o "$OUT_DIR/$name.json"
}

cat > "$OUT_DIR/reporte-cumplimiento.md" <<EOF
# Auditoria Proyecto 7

Generado: $(date -u +%Y-%m-%dT%H:%M:%SZ)

Base publica: $BASE_URL

| Estado | Validacion | Evidencia |
|---|---|---|
EOF

if docker compose config --quiet >/dev/null 2>&1; then
  record OK "docker-compose.yml valido" "Compose local parsea sin errores."
else
  record FAIL "docker-compose.yml valido" "No se pudo validar compose local."
fi

if docker compose -f docker-compose.vps.yml config --quiet >/dev/null 2>&1; then
  record OK "docker-compose.vps.yml valido" "Compose de VPS parsea sin errores."
else
  record FAIL "docker-compose.vps.yml valido" "No se pudo validar compose VPS."
fi

for pair in health:/health summary:/api/summary hosts:/api/hosts db:/api/db/status slo:/api/slo charts:/api/charts compliance:/api/compliance metrics:/metrics; do
  name="${pair%%:*}"
  path="${pair#*:}"
  if curl -fsS "$BASE_URL$path" -o "$OUT_DIR/$name.out"; then
    record OK "Endpoint $path" "Respuesta guardada en $name.out."
  else
    record FAIL "Endpoint $path" "No respondio correctamente."
  fi
done

json_get summary /api/summary
json_get compliance /api/compliance

python3 - <<PY >> "$OUT_DIR/reporte-cumplimiento.md"
import json
from pathlib import Path

out = Path("$OUT_DIR")
summary = json.loads((out / "summary.json").read_text())
compliance = json.loads((out / "compliance.json").read_text())

print(f"| OK | Version desplegada | {summary['version']} |")
print(f"| OK | Hosts monitoreados | {summary['hostsMonitored']} hosts |")
print(f"| OK | Cumplimiento aplicativo | {compliance['scorePercent']}% ({compliance['ok']}/{compliance['total']}) |")
for check in compliance["checks"]:
    state = "OK" if check["status"] == "cumple" else "FAIL"
    print(f"| {state} | {check['area']} - {check['requirement']} | {check['evidence'].replace('|', '/')} |")
PY

python3 - <<PY > "$OUT_DIR/zabbix-audit.json" || true
import json
import urllib.request

url = "$ZABBIX_API_URL"
user = "$ZABBIX_USER"
password = "$ZABBIX_PASSWORD"
req_id = 1

def call(method, params=None, auth=None):
    global req_id
    payload = {"jsonrpc": "2.0", "method": method, "params": params or {}, "id": req_id}
    req_id += 1
    if auth:
        payload["auth"] = auth
    request = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json-rpc"}, method="POST")
    with urllib.request.urlopen(request, timeout=20) as response:
        result = json.loads(response.read().decode())
    if "error" in result:
        raise SystemExit(result["error"])
    return result["result"]

auth = call("user.login", {"username": user, "password": password})
hosts = call("host.get", {"output": ["hostid", "host"], "filter": {"host": ["web-host", "db-host", "dns-host", "ftp-host"]}}, auth)
triggers = call("trigger.get", {"output": ["description", "priority"], "search": {"description": "no responde"}}, auth)
dashboards = call("dashboard.get", {"output": ["name"], "search": {"name": "Proyecto 7"}}, auth)
web = call("httptest.get", {"output": ["name", "status"], "selectSteps": ["name", "url"]}, auth)
print(json.dumps({"hosts": hosts, "triggers": triggers, "dashboards": dashboards, "webScenarios": web}, indent=2, ensure_ascii=False))
PY

if [ -s "$OUT_DIR/zabbix-audit.json" ]; then
  record OK "Auditoria Zabbix API" "Hosts, triggers, dashboards y web scenarios en zabbix-audit.json."
else
  record FAIL "Auditoria Zabbix API" "No se pudo consultar API de Zabbix."
fi

pass="$(grep -c '^| OK |' "$OUT_DIR/reporte-cumplimiento.md" || true)"
fail="$(grep -c '^| FAIL |' "$OUT_DIR/reporte-cumplimiento.md" || true)"

cat >> "$OUT_DIR/reporte-cumplimiento.md" <<EOF

## Resumen

- Validaciones OK: $pass
- Validaciones fallidas: $fail
- Carpeta: $OUT_DIR
EOF

echo "Auditoria guardada en: $OUT_DIR"
