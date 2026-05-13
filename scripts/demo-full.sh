#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://web-zabbix.negociocontigo.com}"
MAILHOG_URL="${MAILHOG_URL:-https://mailhog-zabbix.negociocontigo.com}"
MAILHOG_USER="${MAILHOG_USER:-admin}"
MAILHOG_PASS="${MAILHOG_PASS:-MailUAO2026!}"
ZABBIX_API_URL="${ZABBIX_API_URL:-http://127.0.0.1:8088/api_jsonrpc.php}"
ZABBIX_USER="${ZABBIX_USER:-Admin}"
ZABBIX_PASSWORD="${ZABBIX_PASSWORD:-MonitorUAO2026!}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.vps.yml}"

section() {
  printf '\n== %s ==\n' "$1"
}

section "Estado inicial"
docker compose -f "$COMPOSE_FILE" ps web-service zabbix-server zabbix-web mailhog mailhog-gate

section "Endpoints publicos"
curl -fsS "$BASE_URL/health"
curl -fsS "$BASE_URL/api/summary" | python3 -c "import json,sys; d=json.load(sys.stdin); print({'version': d['version'], 'uptimeSeconds': d['uptimeSeconds'], 'telemetrySamples': d['telemetrySamples'], 'loadRuns': d['loadRuns']})"
curl -fsS "$BASE_URL/metrics" | sed -n '1,14p'

section "Artillery smoke"
if command -v npx >/dev/null 2>&1; then
  npx --yes artillery@latest run tests/artillery-smoke.yml
else
  echo "npx no esta instalado en este host. Ejecuta el smoke desde una maquina con Node.js."
fi

section "Carga sintetica directa"
curl -fsS "$BASE_URL/api/load/mixed?ms=90&kb=96" | python3 -c "import json,sys; d=json.load(sys.stdin); print({'runId': d['recorded']['id'], 'elapsedMs': d['recorded']['elapsedMs'], 'sizeKb': d['recorded']['sizeKb']})"

section "Falla controlada web-service"
docker compose -f "$COMPOSE_FILE" stop web-service
sleep 90
docker compose -f "$COMPOSE_FILE" start web-service
sleep 25
docker compose -f "$COMPOSE_FILE" ps web-service

section "MailHog"
cookie_file="$(mktemp)"
trap 'rm -f "$cookie_file"' EXIT
curl -fsS -c "$cookie_file" -b "$cookie_file" -X POST \
  -d "username=$MAILHOG_USER&password=$MAILHOG_PASS" \
  "$MAILHOG_URL/login" >/dev/null
curl -fsS -b "$cookie_file" "$MAILHOG_URL/api/v2/messages" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print({'total': d['total'], 'subjects': [m['Content']['Headers'].get('Subject', [''])[0] for m in d['items'][:4]]})"

section "Ultimas alertas Zabbix"
python3 - <<PY
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
medias = {m["mediatypeid"]: m["name"] for m in call("mediatype.get", {"output": ["mediatypeid", "name"]}, auth)}
alerts = call("alert.get", {"output": ["alertid", "mediatypeid", "sendto", "subject", "status", "error"], "sortfield": "alertid", "sortorder": "DESC", "limit": 6}, auth)
for alert in alerts:
    print({
        "id": alert["alertid"],
        "media": medias.get(alert["mediatypeid"], alert["mediatypeid"]),
        "sendto": alert["sendto"],
        "subject": alert["subject"],
        "status": alert["status"],
        "error": alert["error"],
    })
PY

section "Demo completa terminada"
echo "Portal: $BASE_URL"
echo "Zabbix: https://zabbix.negociocontigo.com"
echo "MailHog: $MAILHOG_URL/login"
