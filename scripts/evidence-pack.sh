#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://web-zabbix.negociocontigo.com}"
ZABBIX_API_URL="${ZABBIX_API_URL:-http://127.0.0.1:8088/api_jsonrpc.php}"
ZABBIX_USER="${ZABBIX_USER:-Admin}"
ZABBIX_PASSWORD="${ZABBIX_PASSWORD:-MonitorUAO2026!}"
OUT_DIR="${OUT_DIR:-entrega-final/evidencias/$(date -u +%Y%m%dT%H%M%SZ)}"

mkdir -p "$OUT_DIR"

section() {
  printf '\n## %s\n' "$1" | tee -a "$OUT_DIR/README.md"
}

fetch_json() {
  local name="$1"
  local path="$2"
  curl -fsS "$BASE_URL$path" -o "$OUT_DIR/$name.json"
  printf -- "- %s: %s\n" "$path" "$name.json" | tee -a "$OUT_DIR/README.md"
}

cat > "$OUT_DIR/README.md" <<EOF
# Evidencias Proyecto 7

Generado: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Base URL: $BASE_URL

EOF

section "Endpoints publicos"
curl -fsS "$BASE_URL/health" -o "$OUT_DIR/health.txt"
fetch_json summary /api/summary
fetch_json db-status /api/db/status
fetch_json slo /api/slo
fetch_json analytics /api/analytics
fetch_json incidents /api/incidents
curl -fsS "$BASE_URL/metrics" -o "$OUT_DIR/metrics.prom"
printf -- "- /metrics: metrics.prom\n" | tee -a "$OUT_DIR/README.md"

section "Carga smoke Artillery"
if command -v npx >/dev/null 2>&1; then
  npx --yes artillery@latest run tests/artillery-smoke.yml --output "$OUT_DIR/artillery-smoke.json" | tee "$OUT_DIR/artillery-smoke.txt"
  printf -- "- Resultado texto: artillery-smoke.txt\n- Resultado JSON: artillery-smoke.json\n" | tee -a "$OUT_DIR/README.md"
elif command -v docker >/dev/null 2>&1; then
  docker run --rm -v "$PWD:/work" -w /work node:20-alpine \
    sh -lc "npx --yes artillery@latest run tests/artillery-smoke.yml --output '$OUT_DIR/artillery-smoke.json'" \
    | tee "$OUT_DIR/artillery-smoke.txt"
  printf -- "- Resultado texto: artillery-smoke.txt\n- Resultado JSON: artillery-smoke.json\n" | tee -a "$OUT_DIR/README.md"
else
  echo "npx no esta disponible; se omitio Artillery." | tee "$OUT_DIR/artillery-smoke.txt"
fi

section "Items Zabbix principales"
python3 - <<PY > "$OUT_DIR/zabbix-items.json"
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
items = call(
    "item.get",
    {
        "output": ["name", "key_", "lastvalue", "state", "error", "lastclock"],
        "host": "web-host",
        "filter": {"key_": ["proyecto7.metrics.exporter", "proyecto7.db.status"]},
    },
    auth,
)
scenarios = call("httptest.get", {"output": ["name", "status"], "selectSteps": ["name", "url", "status_codes"]}, auth)
print(json.dumps({"items": items, "webScenarios": scenarios}, indent=2, ensure_ascii=False))
PY
printf -- "- API Zabbix: zabbix-items.json\n" | tee -a "$OUT_DIR/README.md"

section "Resumen rapido"
python3 - <<PY | tee -a "$OUT_DIR/README.md"
import json
from pathlib import Path
base = Path("$OUT_DIR")
summary = json.loads((base / "summary.json").read_text())
db = json.loads((base / "db-status.json").read_text())
slo = json.loads((base / "slo.json").read_text())
print(f"- Version app: {summary['version']}")
print(f"- DB conectada: {db['connected']}")
print(f"- Telemetria persistida: {db['telemetryRows']}")
print(f"- Incidentes abiertos: {db['openIncidents']}")
print(f"- SLO runtime: {slo['availabilityPercent']}% ({slo['status']})")
PY

echo "Evidencias guardadas en: $OUT_DIR"
