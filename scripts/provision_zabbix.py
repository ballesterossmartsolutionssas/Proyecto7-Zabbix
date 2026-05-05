#!/usr/bin/env python3
import json
import os
import sys
import time
import urllib.error
import urllib.request

URL = os.environ.get("ZABBIX_API_URL", "http://localhost:8088/api_jsonrpc.php")
USER = "Admin"
PASSWORD = "zabbix"
GROUP_NAME = "Proyecto 7 - Infraestructura Docker"
LINUX_TEMPLATE = "Linux by Zabbix agent"

HOSTS = [
    {
        "host": "web-host",
        "agent_dns": "web-agent",
        "service_name": "HTTP web-service",
        "service_key": "net.tcp.service[http,web-service,80]",
    },
    {
        "host": "db-host",
        "agent_dns": "db-agent",
        "service_name": "MySQL db-service",
        "service_key": "net.tcp.service[tcp,db-service,3306]",
    },
    {
        "host": "dns-host",
        "agent_dns": "dns-agent",
        "service_name": "DNS dns-service TCP",
        "service_key": "net.tcp.service[tcp,dns-service,53]",
    },
    {
        "host": "ftp-host",
        "agent_dns": "ftp-agent",
        "service_name": "FTP ftp-service",
        "service_key": "net.tcp.service[ftp,ftp-service,21]",
    },
]


class Zabbix:
    def __init__(self, url):
        self.url = url
        self.auth = None
        self.req_id = 1

    def call(self, method, params=None, auth=True):
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params or {},
            "id": self.req_id,
        }
        self.req_id += 1
        if auth and self.auth:
            payload["auth"] = self.auth
        data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            self.url,
            data=data,
            headers={"Content-Type": "application/json-rpc"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=20) as response:
            result = json.loads(response.read().decode("utf-8"))
        if "error" in result:
            raise RuntimeError(f"{method}: {result['error']}")
        return result["result"]

    def login(self):
        try:
            self.auth = self.call(
                "user.login",
                {"user": USER, "password": PASSWORD},
                auth=False,
            )
        except RuntimeError:
            self.auth = self.call(
                "user.login",
                {"username": USER, "password": PASSWORD},
                auth=False,
            )


def wait_for_api(api, timeout_seconds=300):
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            api.login()
            return
        except (urllib.error.URLError, TimeoutError, RuntimeError) as exc:
            print(f"Esperando Zabbix API: {exc}")
            time.sleep(10)
    raise TimeoutError("Zabbix API no respondio a tiempo")


def ensure_group(api):
    groups = api.call("hostgroup.get", {"filter": {"name": [GROUP_NAME]}})
    if groups:
        return groups[0]["groupid"]
    created = api.call("hostgroup.create", {"name": GROUP_NAME})
    return created["groupids"][0]


def find_template(api):
    templates = api.call("template.get", {"filter": {"host": [LINUX_TEMPLATE]}})
    if not templates:
        print(f"AVISO: No se encontro el template '{LINUX_TEMPLATE}'. Se crearan items basicos.")
        return None
    return templates[0]["templateid"]


def remove_default_zabbix_server_host(api):
    hosts = api.call("host.get", {"output": ["hostid", "host"], "filter": {"host": ["Zabbix server"]}})
    if hosts:
        api.call("host.delete", [hosts[0]["hostid"]])
        print("Host demo 'Zabbix server' eliminado para evitar alertas ajenas al proyecto.")


def ensure_host(api, groupid, templateid, host):
    existing = api.call("host.get", {"filter": {"host": [host["host"]]}})
    if existing:
        hostid = existing[0]["hostid"]
        interfaces = api.call(
            "hostinterface.get",
            {
                "hostids": hostid,
                "filter": {"type": 1, "main": 1},
            },
        )
        if not interfaces:
            api.call(
                "hostinterface.create",
                {
                    "hostid": hostid,
                    "type": 1,
                    "main": 1,
                    "useip": 0,
                    "ip": "",
                    "dns": host["agent_dns"],
                    "port": "10050",
                },
            )
    else:
        params = {
            "host": host["host"],
            "name": host["host"],
            "groups": [{"groupid": groupid}],
            "interfaces": [
                {
                    "type": 1,
                    "main": 1,
                    "useip": 0,
                    "ip": "",
                    "dns": host["agent_dns"],
                    "port": "10050",
                }
            ],
        }
        if templateid:
            params["templates"] = [{"templateid": templateid}]
        created = api.call("host.create", params)
        hostid = created["hostids"][0]
    return hostid


def get_main_agent_interface(api, hostid):
    interfaces = api.call(
        "hostinterface.get",
        {
            "hostids": hostid,
            "filter": {"type": 1, "main": 1},
        },
    )
    if not interfaces:
        raise RuntimeError(f"No se encontro interfaz de agente para hostid {hostid}")
    return interfaces[0]["interfaceid"]


def ensure_item(api, hostid, interfaceid, name, key, value_type=3, item_type=0):
    items = api.call(
        "item.get",
        {
            "output": ["itemid", "type", "interfaceid"],
            "hostids": hostid,
            "filter": {"key_": [key]},
        },
    )
    if items:
        update = {"itemid": items[0]["itemid"]}
        if str(items[0].get("type")) != str(item_type):
            update["type"] = item_type
        if item_type in (0, 3) and str(items[0].get("interfaceid", "")) != str(interfaceid):
            update["interfaceid"] = interfaceid
        if len(update) > 1:
            api.call("item.update", update)
        return items[0]["itemid"]
    params = {
        "hostid": hostid,
        "name": name,
        "key_": key,
        "type": item_type,
        "value_type": value_type,
        "delay": "30s",
    }
    if item_type in (0, 3):
        params["interfaceid"] = interfaceid
    created = api.call(
        "item.create",
        params,
    )
    return created["itemids"][0]


def ensure_trigger(api, description, expression, priority=4):
    triggers = api.call(
        "trigger.get",
        {"output": ["triggerid", "expression", "priority"], "filter": {"description": [description]}},
    )
    if triggers:
        update = {"triggerid": triggers[0]["triggerid"]}
        if triggers[0].get("expression") != expression:
            update["expression"] = expression
        if str(triggers[0].get("priority")) != str(priority):
            update["priority"] = priority
        if len(update) > 1:
            api.call("trigger.update", update)
        return triggers[0]["triggerid"]
    created = api.call(
        "trigger.create",
        {
            "description": description,
            "expression": expression,
            "priority": priority,
        },
    )
    return created["triggerids"][0]


def configure_mailhog(api):
    media_types = api.call("mediatype.get", {"filter": {"name": ["Email"]}})
    if not media_types:
        print("AVISO: No se encontro el media type Email. Configurarlo manualmente en Administration > Media types.")
        return
    media = media_types[0]
    api.call(
        "mediatype.update",
        {
            "mediatypeid": media["mediatypeid"],
            "status": 0,
            "smtp_server": "mailhog",
            "smtp_port": "1025",
            "smtp_email": "zabbix@proyecto7.local",
            "smtp_helo": "zabbix.local",
        },
    )
    print("Media type Email apuntando a MailHog en mailhog:1025.")
    users = api.call(
        "user.get",
        {
            "output": ["userid", "username"],
            "selectMedias": "extend",
            "filter": {"username": [USER]},
        },
    )
    if users:
        api.call(
            "user.update",
            {
                "userid": users[0]["userid"],
                "medias": [
                    {
                        "mediatypeid": media["mediatypeid"],
                        "sendto": ["admin@proyecto7.local"],
                        "active": 0,
                        "severity": 63,
                        "period": "1-7,00:00-24:00",
                    }
                ],
            },
        )
        print("Usuario Admin configurado con media admin@proyecto7.local.")
    actions = api.call(
        "action.get",
        {"output": ["actionid", "name", "status"], "filter": {"name": ["Report problems to Zabbix administrators"]}},
    )
    if actions:
        api.call("action.update", {"actionid": actions[0]["actionid"], "status": 0})
        print("Accion por defecto de problemas habilitada para enviar alertas.")


def main():
    api = Zabbix(URL)
    wait_for_api(api)
    groupid = ensure_group(api)
    templateid = find_template(api)
    remove_default_zabbix_server_host(api)

    for host in HOSTS:
        hostid = ensure_host(api, groupid, templateid, host)
        interfaceid = get_main_agent_interface(api, hostid)
        ensure_item(api, hostid, interfaceid, "Agent ping", "agent.ping")
        ensure_item(
            api,
            hostid,
            interfaceid,
            f"Disponibilidad {host['service_name']}",
            host["service_key"],
            item_type=3,
        )
        ensure_trigger(
            api,
            f"{host['service_name']} no responde",
            f"last(/{host['host']}/{host['service_key']})=0",
            priority=4,
        )
        ensure_trigger(
            api,
            f"{host['host']} sin datos del agente",
            f"nodata(/{host['host']}/agent.ping,5m)=1",
            priority=4,
        )
        print(f"Host configurado: {host['host']} -> agente {host['agent_dns']}")

    configure_mailhog(api)
    print("Provisionamiento terminado.")
    print("Usuario web Zabbix: Admin / zabbix")
    print("Frontend: http://localhost:8088")
    print("MailHog: http://localhost:8025")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
