#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://web-zabbix.negociocontigo.com}"
ZABBIX_API_URL="${ZABBIX_API_URL:-http://127.0.0.1:8088/api_jsonrpc.php}"
ZABBIX_USER="${ZABBIX_USER:-Admin}"
ZABBIX_PASSWORD="${ZABBIX_PASSWORD:-MonitorUAO2026!}"
OUT_DIR="${OUT_DIR:-entrega-final/evidencias/live-$(date -u +%Y%m%dT%H%M%SZ)}"

mkdir -p "$OUT_DIR"

section() {
  printf '\n== %s ==\n' "$1"
}

snapshot() {
  local label="$1"
  curl -fsS "$BASE_URL/api/live" -o "$OUT_DIR/live-$label.json"
  curl -fsS "$BASE_URL/metrics" -o "$OUT_DIR/metrics-$label.prom"
  python3 - <<PY
import json
from pathlib import Path
data = json.loads(Path("$OUT_DIR/live-$label.json").read_text())
print({
    "label": "$label",
    "requests": data["requestsTotal"],
    "loads": len(data["loadRuns"]),
    "telemetryRows": data["database"]["telemetryRows"],
    "slo": data["slo"]["availabilityPercent"],
})
PY
}

section "Pre-check"
artillery --version
snapshot before

section "Artillery live demo"
artillery run tests/artillery-live-demo.yml --output "$OUT_DIR/artillery-live.json" | tee "$OUT_DIR/artillery-live.txt"

section "Post-check"
snapshot after

section "Zabbix snapshot"
python3 - <<PY > "$OUT_DIR/zabbix-live.json"
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
problems = call("problem.get", {"output": ["name", "severity", "clock"], "recent": True, "sortfield": "eventid", "sortorder": "DESC", "limit": 10}, auth)
print(json.dumps({"items": items, "recentProblems": problems}, indent=2, ensure_ascii=False))
PY

section "Resultado"
echo "Evidencias live guardadas en: $OUT_DIR"
