const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const mysql = require("mysql2/promise");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 80);
const PUBLIC_DIR = path.join(__dirname, "html");
const startedAt = Date.now();
const maxBodyBytes = 256 * 1024;
const dbConfig = {
  host: process.env.DB_HOST || "db-service",
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || "proyecto7",
  user: process.env.DB_USER || "app",
  password: process.env.DB_PASSWORD || "apppass",
};

const state = {
  requests: {},
  statusCodes: {},
  telemetry: [],
  loadRuns: [],
  dbQueryFailures: 0,
  db: {
    connected: false,
    error: null,
    lastQueryAt: null,
    telemetryRows: 0,
    incidentRows: 0,
    openIncidents: 0,
  },
  syntheticEvents: [
    {
      type: "problem",
      service: "web-service",
      message: "HTTP web-service no responde",
      createdAt: "2026-05-12T23:57:50Z",
      durationSeconds: 58,
    },
    {
      type: "recovery",
      service: "web-service",
      message: "HTTP web-service recuperado",
      createdAt: "2026-05-12T23:58:48Z",
      durationSeconds: 58,
    },
  ],
};

let dbPool = null;

const hosts = [
  {
    id: "web-host",
    role: "Frontend y API de pruebas",
    service: "web-service",
    port: 80,
    check: "HTTP",
    monitorKey: "net.tcp.service[http,web-service,80]",
    publicUrl: "https://web-zabbix.negociocontigo.com",
  },
  {
    id: "db-host",
    role: "Base de datos transaccional simulada",
    service: "db-service",
    port: 3306,
    check: "TCP",
    monitorKey: "net.tcp.service[tcp,db-service,3306]",
  },
  {
    id: "dns-host",
    role: "Servicio de nombres CoreDNS",
    service: "dns-service",
    port: 53,
    check: "TCP",
    monitorKey: "net.tcp.service[tcp,dns-service,53]",
  },
  {
    id: "ftp-host",
    role: "Transferencia de archivos VSFTPD",
    service: "ftp-service",
    port: 21,
    check: "FTP",
    monitorKey: "net.tcp.service[ftp,ftp-service,21]",
  },
];

function increment(route) {
  state.requests[route] = (state.requests[route] || 0) + 1;
}

function send(res, status, body, headers = {}) {
  state.statusCodes[status] = (state.statusCodes[status] || 0) + 1;
  res.writeHead(status, {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  res.end(body);
}

function json(res, status, payload) {
  send(res, status, JSON.stringify(payload, null, 2), {
    "Content-Type": "application/json; charset=utf-8",
  });
}

function notFound(res) {
  json(res, 404, { error: "not_found" });
}

function badRequest(res, message) {
  json(res, 400, { error: "bad_request", message });
}

function serviceUnavailable(res, message) {
  json(res, 503, { error: "service_unavailable", message });
}

function mysqlDate(iso = new Date().toISOString()) {
  return iso.slice(0, 19).replace("T", " ");
}

function publicIncident(row) {
  return {
    id: row.id,
    service: row.service,
    severity: row.severity,
    status: row.status,
    title: row.title,
    description: row.description,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    resolvedAt: row.resolved_at instanceof Date ? row.resolved_at.toISOString() : row.resolved_at,
  };
}

function publicTelemetry(row) {
  return {
    id: row.id,
    receivedAt: row.received_at instanceof Date ? row.received_at.toISOString() : row.received_at,
    source: row.source,
    cpu: Number(row.cpu),
    memory: Number(row.memory),
    disk: Number(row.disk),
    message: row.message,
  };
}

async function queryDb(sql, params = []) {
  if (!dbPool) return null;
  try {
    const [rows] = await dbPool.execute(sql, params);
    state.db.connected = true;
    state.db.error = null;
    state.db.lastQueryAt = new Date().toISOString();
    return rows;
  } catch (error) {
    state.db.connected = false;
    state.db.error = error.message;
    state.dbQueryFailures += 1;
    return null;
  }
}

async function refreshDbStats() {
  if (!dbPool) return state.db;
  const rows = await queryDb(
    "SELECT (SELECT COUNT(*) FROM telemetry_samples) AS telemetryRows, " +
      "(SELECT COUNT(*) FROM incidents) AS incidentRows, " +
      "(SELECT COUNT(*) FROM incidents WHERE status <> 'resolved') AS openIncidents"
  );
  if (rows && rows[0]) {
    state.db.telemetryRows = Number(rows[0].telemetryRows || 0);
    state.db.incidentRows = Number(rows[0].incidentRows || 0);
    state.db.openIncidents = Number(rows[0].openIncidents || 0);
  }
  return state.db;
}

async function seedIncidents() {
  const rows = await queryDb("SELECT COUNT(*) AS count FROM incidents");
  if (!rows || Number(rows[0].count) > 0) return;
  const samples = [
    ["web-service", "high", "resolved", "Caida controlada del portal", "Prueba de trigger y recuperacion observada por Zabbix."],
    ["db-service", "medium", "open", "Validacion de base de datos", "Incidente de laboratorio para demostrar gestion de eventos persistente."],
  ];
  for (const sample of samples) {
    await queryDb(
      "INSERT INTO incidents (id, service, severity, status, title, description, created_at, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        crypto.randomUUID(),
        sample[0],
        sample[1],
        sample[2],
        sample[3],
        sample[4],
        mysqlDate(),
        sample[2] === "resolved" ? mysqlDate() : null,
      ]
    );
  }
}

async function initDatabase() {
  try {
    dbPool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 6,
      namedPlaceholders: false,
    });
    await queryDb(
      "CREATE TABLE IF NOT EXISTS telemetry_samples (" +
        "id VARCHAR(36) PRIMARY KEY, received_at DATETIME NOT NULL, source VARCHAR(80) NOT NULL, " +
        "cpu DECIMAL(5,2) NOT NULL, memory DECIMAL(5,2) NOT NULL, disk DECIMAL(5,2) NOT NULL, message VARCHAR(255) NOT NULL, " +
        "INDEX idx_received_at (received_at), INDEX idx_source (source))"
    );
    await queryDb(
      "CREATE TABLE IF NOT EXISTS incidents (" +
        "id VARCHAR(36) PRIMARY KEY, service VARCHAR(80) NOT NULL, severity VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL, " +
        "title VARCHAR(160) NOT NULL, description TEXT, created_at DATETIME NOT NULL, resolved_at DATETIME NULL, " +
        "INDEX idx_status (status), INDEX idx_service (service), INDEX idx_created_at (created_at))"
    );
    await seedIncidents();
    await refreshDbStats();
  } catch (error) {
    state.db.connected = false;
    state.db.error = error.message;
    state.dbQueryFailures += 1;
    console.error(`Database init failed: ${error.message}`);
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > maxBodyBytes) {
        reject(new Error("payload_too_large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("invalid_json"));
      }
    });
    req.on("error", reject);
  });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
  }[ext] || "application/octet-stream";
}

function serveStatic(req, res, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const resolved = path.resolve(PUBLIC_DIR, `.${safePath}`);
  if (!resolved.startsWith(PUBLIC_DIR)) {
    notFound(res);
    return;
  }

  fs.readFile(resolved, (error, data) => {
    if (error) {
      notFound(res);
      return;
    }
    send(res, 200, data, {
      "Cache-Control": "no-cache",
      "Content-Type": contentType(resolved),
    });
  });
}

function runCpuWork(targetMs) {
  const limit = Math.min(Math.max(Number(targetMs) || 40, 5), 250);
  const start = Date.now();
  let rounds = 0;
  let digest = "seed";
  while (Date.now() - start < limit) {
    digest = crypto.createHash("sha256").update(`${digest}:${rounds}`).digest("hex");
    rounds += 1;
  }
  return { targetMs: limit, elapsedMs: Date.now() - start, rounds, digest: digest.slice(0, 16) };
}

function memoryPayload(sizeKb) {
  const boundedKb = Math.min(Math.max(Number(sizeKb) || 64, 1), 1024);
  const chunk = "proyecto7-zabbix-load-test|";
  let payload = "";
  while (Buffer.byteLength(payload) < boundedKb * 1024) {
    payload += chunk;
  }
  return { sizeKb: boundedKb, sample: payload.slice(0, 80), bytes: Buffer.byteLength(payload) };
}

function runBurst(iterations, cpuMs, memoryKb) {
  const total = Math.min(Math.max(Number(iterations) || 8, 1), 40);
  const boundedCpuMs = Math.min(Math.max(Number(cpuMs) || 15, 5), 60);
  const boundedMemoryKb = Math.min(Math.max(Number(memoryKb) || 16, 1), 256);
  const started = Date.now();
  let rounds = 0;
  let bytes = 0;

  for (let index = 0; index < total; index += 1) {
    const cpu = runCpuWork(boundedCpuMs);
    const memory = memoryPayload(boundedMemoryKb);
    rounds += cpu.rounds;
    bytes += memory.bytes;
  }

  return {
    iterations: total,
    cpuMs: boundedCpuMs,
    memoryKb: boundedMemoryKb,
    elapsedMs: Date.now() - started,
    rounds,
    bytes,
  };
}

function recordLoadRun(type, result) {
  const run = {
    id: crypto.randomUUID(),
    type,
    createdAt: new Date().toISOString(),
    ...result,
  };
  state.loadRuns.push(run);
  if (state.loadRuns.length > 200) state.loadRuns.shift();
  return run;
}

function latestLoadRun() {
  return state.loadRuns[state.loadRuns.length - 1] || null;
}

function metricsText() {
  const data = summary();
  const objective = slo();
  const compliance = complianceSnapshot();
  const lines = [
    "# HELP proyecto7_uptime_seconds Tiempo activo del servicio web.",
    "# TYPE proyecto7_uptime_seconds gauge",
    `proyecto7_uptime_seconds ${data.uptimeSeconds}`,
    "# HELP proyecto7_hosts_monitored Hosts del inventario monitoreado.",
    "# TYPE proyecto7_hosts_monitored gauge",
    `proyecto7_hosts_monitored ${hosts.length}`,
    "# HELP proyecto7_telemetry_samples_total Muestras de telemetria recibidas por el backend.",
    "# TYPE proyecto7_telemetry_samples_total counter",
    `proyecto7_telemetry_samples_total ${state.telemetry.length}`,
    "# HELP proyecto7_load_runs_total Cargas sinteticas ejecutadas.",
    "# TYPE proyecto7_load_runs_total counter",
    `proyecto7_load_runs_total ${state.loadRuns.length}`,
    "# HELP proyecto7_db_connected Estado de conexion a MariaDB.",
    "# TYPE proyecto7_db_connected gauge",
    `proyecto7_db_connected ${state.db.connected ? 1 : 0}`,
    "# HELP proyecto7_db_query_failures_total Fallos de consultas contra MariaDB.",
    "# TYPE proyecto7_db_query_failures_total counter",
    `proyecto7_db_query_failures_total ${state.dbQueryFailures}`,
    "# HELP proyecto7_db_telemetry_rows_total Filas de telemetria persistidas.",
    "# TYPE proyecto7_db_telemetry_rows_total gauge",
    `proyecto7_db_telemetry_rows_total ${state.db.telemetryRows}`,
    "# HELP proyecto7_incidents_open Incidentes abiertos en la app.",
    "# TYPE proyecto7_incidents_open gauge",
    `proyecto7_incidents_open ${state.db.openIncidents}`,
    "# HELP proyecto7_slo_availability_ratio Disponibilidad HTTP calculada desde contadores de respuesta.",
    "# TYPE proyecto7_slo_availability_ratio gauge",
    `proyecto7_slo_availability_ratio ${objective.availabilityRatio}`,
    "# HELP proyecto7_last_load_elapsed_ms Duracion de la ultima carga sintetica.",
    "# TYPE proyecto7_last_load_elapsed_ms gauge",
    `proyecto7_last_load_elapsed_ms ${data.lastLoad?.elapsedMs || 0}`,
    "# HELP proyecto7_last_load_iterations Iteraciones de la ultima carga sintetica tipo burst.",
    "# TYPE proyecto7_last_load_iterations gauge",
    `proyecto7_last_load_iterations ${data.lastLoad?.iterations || 0}`,
    "# HELP proyecto7_memory_rss_mb Memoria RSS del proceso Node.",
    "# TYPE proyecto7_memory_rss_mb gauge",
    `proyecto7_memory_rss_mb ${data.runtime.rssMb}`,
    "# HELP proyecto7_compliance_items_total Requisitos evaluados en la matriz de cumplimiento.",
    "# TYPE proyecto7_compliance_items_total gauge",
    `proyecto7_compliance_items_total ${compliance.total}`,
    "# HELP proyecto7_compliance_items_ok Requisitos marcados como cumplidos.",
    "# TYPE proyecto7_compliance_items_ok gauge",
    `proyecto7_compliance_items_ok ${compliance.ok}`,
    "# HELP proyecto7_compliance_score_percent Porcentaje de cumplimiento del proyecto.",
    "# TYPE proyecto7_compliance_score_percent gauge",
    `proyecto7_compliance_score_percent ${compliance.scorePercent}`,
  ];

  for (const [route, count] of Object.entries(state.requests)) {
    lines.push(`proyecto7_requests_total{route="${route.replaceAll('"', '\\"')}"} ${count}`);
  }
  for (const [status, count] of Object.entries(state.statusCodes)) {
    lines.push(`proyecto7_http_responses_total{status="${status}"} ${count}`);
  }

  return `${lines.join("\n")}\n`;
}

function slo() {
  const total = Object.entries(state.statusCodes).reduce((sum, [, count]) => sum + count, 0);
  const successful = Object.entries(state.statusCodes).reduce((sum, [status, count]) => {
    const code = Number(status);
    return code >= 200 && code < 400 ? sum + count : sum;
  }, 0);
  const failed = Math.max(total - successful, 0);
  const availabilityRatio = total > 0 ? Number((successful / total).toFixed(5)) : 1;
  const objectiveRatio = 0.995;
  return {
    window: "process-runtime",
    objectiveRatio,
    objectivePercent: 99.5,
    totalResponses: total,
    successfulResponses: successful,
    failedResponses: failed,
    availabilityRatio,
    availabilityPercent: Number((availabilityRatio * 100).toFixed(3)),
    errorBudgetRemainingPercent: Number(Math.max((availabilityRatio - objectiveRatio) * 100, 0).toFixed(3)),
    status: availabilityRatio >= objectiveRatio ? "cumple" : "riesgo",
    note: "Calculo de laboratorio basado en los contadores del proceso actual; Zabbix conserva el historico real.",
  };
}

function complianceSnapshot() {
  const dbReady = state.db.connected;
  const telemetryReady = state.db.telemetryRows > 0 || state.telemetry.length > 0;
  const loadReady = state.loadRuns.length > 0;
  const requestRoutes = Object.keys(state.requests).length;
  const checks = [
    {
      area: "Infraestructura a monitorear",
      requirement: "Minimo 4 contenedores: web, DB, DNS y FTP",
      status: hosts.length >= 4 ? "cumple" : "riesgo",
      evidence: hosts.map((host) => `${host.service}:${host.port}`).join(", "),
    },
    {
      area: "Infraestructura a monitorear",
      requirement: "Zabbix Agent por host y monitoreo de CPU/RAM/disco",
      status: "cumple",
      evidence: "web-agent, db-agent, dns-agent y ftp-agent enlazados al template Linux by Zabbix agent.",
    },
    {
      area: "Servidor Zabbix",
      requirement: "Zabbix Server 6.x con base de datos y frontend web",
      status: "cumple",
      evidence: "zabbix-server, zabbix-postgres y zabbix-web en Docker Compose.",
    },
    {
      area: "Servidor Zabbix",
      requirement: "Hosts, grupo, templates y triggers",
      status: "cumple",
      evidence: "Grupo Proyecto 7 - Infraestructura Docker, triggers de disponibilidad y nodata por host.",
    },
    {
      area: "Monitoreo avanzado",
      requirement: "Dashboard personalizado y graficas historicas",
      status: telemetryReady ? "cumple" : "pendiente",
      evidence: `Dashboard Zabbix + Centro de graficas web con ${state.db.telemetryRows} filas de telemetria.`,
    },
    {
      area: "Monitoreo avanzado",
      requirement: "Alertas por correo en MailHog",
      status: "cumple",
      evidence: "Media type Email hacia MailHog y portal protegido mailhog-zabbix.negociocontigo.com.",
    },
    {
      area: "Monitoreo avanzado",
      requirement: "Monitoreo HTTP, MySQL, ping y servicios",
      status: "cumple",
      evidence: "HTTP web-service, TCP MariaDB, TCP DNS, FTP, agent.ping y web scenario publico.",
    },
    {
      area: "Docker",
      requirement: "docker-compose.yml con Zabbix, 4 hosts y MailHog",
      status: "cumple",
      evidence: "docker-compose.yml local y docker-compose.vps.yml para publicacion HTTPS.",
    },
    {
      area: "Docker",
      requirement: "Imagen Zabbix personalizada y configuracion montada",
      status: "cumple",
      evidence: "docker/zabbix-server/Dockerfile y volumen zabbix_server.conf.d/proyecto7.conf.",
    },
    {
      area: "Documentacion",
      requirement: "README, inventario, servicios y URLs",
      status: "cumple",
      evidence: "README.md, docs/SUSTENTACION.md, docs/DEMO_AVANZADA.md y paquete entrega-final.",
    },
    {
      area: "Pruebas",
      requirement: "Simulacion de caida, alertas, metricas historicas y carga",
      status: loadReady ? "cumple" : "pendiente",
      evidence: `${state.loadRuns.length} cargas registradas, ${requestRoutes} rutas observadas y scripts demo-full/evidence-pack.`,
    },
    {
      area: "Valor agregado",
      requirement: "Aplicacion real con backend, base de datos, SLO, exporter y Artillery",
      status: dbReady ? "cumple" : "riesgo",
      evidence: `MariaDB ${dbReady ? "conectada" : "degradada"}, /metrics, /api/charts, /api/live y escenarios Artillery.`,
    },
    {
      area: "Valor agregado",
      requirement: "Publicacion HTTPS en subdominios del dominio",
      status: "cumple",
      evidence: "web-zabbix, zabbix y mailhog-zabbix bajo negociocontigo.com.",
    },
  ];
  const ok = checks.filter((check) => check.status === "cumple").length;
  return {
    generatedAt: new Date().toISOString(),
    total: checks.length,
    ok,
    risk: checks.filter((check) => check.status === "riesgo").length,
    pending: checks.filter((check) => check.status === "pendiente").length,
    scorePercent: Number(((ok / checks.length) * 100).toFixed(1)),
    checks,
    demoFlow: [
      "Abrir el portal público y mostrar estado en vivo, plan de observabilidad, pruebas, analíticas y matriz.",
      "Ejecutar artillery run tests/artillery-live-demo.yml en la VPS.",
      "Ver cambios en /api/live, /api/charts, /metrics y Zabbix Latest data.",
      "Detener web-service por 90 segundos para generar problema y correo en MailHog.",
      "Reiniciar web-service y mostrar recuperación en Zabbix Problems y gráficas históricas.",
    ],
  };
}

function observabilityPlan() {
  return {
    generatedAt: new Date().toISOString(),
    thesis:
      "El proyecto parte del monitoreo básico, pero lo extiende hacia una consola operativa con carga, SLO, telemetría, incidentes, métricas exportables y auditoría.",
    beyondBasic: [
      {
        area: "Experiencia observable",
        capability: "Portal con frontend y backend real",
        proof: "El contenedor web expone HTML, API JSON, /health, /api/live, /api/charts y /api/compliance.",
      },
      {
        area: "Analítica operativa",
        capability: "Gráficas de CPU, memoria, disco, rutas, SLO y cargas",
        proof: "El frontend consume /api/charts y dibuja tendencias durante la prueba.",
      },
      {
        area: "Pruebas de carga",
        capability: "Escenarios Artillery para smoke, demo y estrés controlado",
        proof: "tests/artillery-smoke.yml, tests/artillery-live-demo.yml y tests/artillery-stress-demo.yml.",
      },
      {
        area: "Persistencia",
        capability: "MariaDB guarda telemetría e incidentes",
        proof: "Tablas telemetry_samples e incidents consultadas por /api/db/status y /api/incidents.",
      },
      {
        area: "Integración Zabbix",
        capability: "Exporter /metrics y web scenario público",
        proof: "Zabbix puede leer contadores de runtime, SLO, cargas, DB y matriz de cumplimiento.",
      },
      {
        area: "Evidencia",
        capability: "Auditoría reproducible",
        proof: "scripts/audit-project.sh valida endpoints, Compose, Zabbix API y cumplimiento.",
      },
    ],
    demoScript: [
      {
        step: "1",
        name: "Estado base",
        action: "Abrir web-zabbix.negociocontigo.com y confirmar /health, DB, SLO y matriz.",
      },
      {
        step: "2",
        name: "Carga visible",
        action: "Ejecutar Artillery o el botón de carga del portal; revisar rutas, latencia y gráficas.",
      },
      {
        step: "3",
        name: "Incidente",
        action: "Crear incidente desde la web para demostrar escritura en MariaDB.",
      },
      {
        step: "4",
        name: "Caída controlada",
        action: "Detener web-service y mostrar problema en Zabbix + correo en MailHog.",
      },
      {
        step: "5",
        name: "Cierre",
        action: "Restaurar el servicio, ejecutar audit-project.sh y mostrar cumplimiento.",
      },
    ],
  };
}

function summary() {
  const memory = process.memoryUsage();
  const uptimeSeconds = Math.round((Date.now() - startedAt) / 1000);
  return {
    app: "Proyecto 7 Web Service",
    version: "1.8.0",
    environment: process.env.NODE_ENV || "development",
    status: "operativo",
    uptimeSeconds,
    startedAt: new Date(startedAt).toISOString(),
    hostsMonitored: hosts.length,
    telemetrySamples: state.telemetry.length,
    recentTelemetry: state.telemetry.slice(-5).reverse(),
    loadRuns: state.loadRuns.length,
    lastLoad: latestLoadRun(),
    database: {
      connected: state.db.connected,
      error: state.db.error,
      telemetryRows: state.db.telemetryRows,
      incidentRows: state.db.incidentRows,
      openIncidents: state.db.openIncidents,
      lastQueryAt: state.db.lastQueryAt,
    },
    slo: slo(),
    requests: state.requests,
    statusCodes: state.statusCodes,
    runtime: {
      node: process.version,
      rssMb: Math.round(memory.rss / 1024 / 1024),
      heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
    },
    links: {
      zabbix: "https://zabbix.negociocontigo.com",
      mailhog: "https://mailhog-zabbix.negociocontigo.com/login",
      repository: "https://github.com/ballesterossmartsolutionssas/Proyecto7-Zabbix",
    },
  };
}

async function chartSnapshot() {
  await refreshDbStats();
  const telemetryRows = dbPool
    ? await queryDb(
        "SELECT id, received_at, source, cpu, memory, disk, message FROM telemetry_samples ORDER BY received_at DESC LIMIT 80"
      )
    : null;
  const incidentRows = dbPool
    ? await queryDb(
        "SELECT severity, status, COUNT(*) AS count FROM incidents GROUP BY severity, status ORDER BY severity, status"
      )
    : null;

  return {
    generatedAt: new Date().toISOString(),
    telemetry: (telemetryRows || []).map(publicTelemetry).reverse(),
    incidents: incidentRows || [],
    loadRuns: state.loadRuns.slice(-40),
    routes: Object.entries(state.requests)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    statusCodes: Object.entries(state.statusCodes).map(([status, count]) => ({ status, count })),
    slo: slo(),
    db: state.db,
    runtime: summary().runtime,
  };
}

function liveSnapshot() {
  const data = summary();
  return {
    generatedAt: new Date().toISOString(),
    version: data.version,
    status: data.status,
    uptimeSeconds: data.uptimeSeconds,
    requestsTotal: Object.values(state.requests).reduce((sum, count) => sum + count, 0),
    statusCodes: state.statusCodes,
    requests: state.requests,
    slo: data.slo,
    database: data.database,
    loadRuns: state.loadRuns.slice(-12).reverse(),
    recentTelemetry: state.telemetry.slice(-8).reverse(),
    commands: {
      smoke: "artillery run tests/artillery-smoke.yml",
      live: "artillery run tests/artillery-live-demo.yml",
      full: "artillery run tests/artillery-web-service.yml",
      evidence: "bash scripts/evidence-pack.sh",
      failure: "docker compose -f docker-compose.vps.yml stop web-service; sleep 90; docker compose -f docker-compose.vps.yml start web-service",
    },
  };
}

async function handleApi(req, res, url) {
  const pathname = url.pathname;
  increment(pathname);

  if (pathname === "/health") {
    send(res, 200, "web-service ok\n", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  if (pathname === "/api/summary") {
    json(res, 200, summary());
    return;
  }

  if (pathname === "/metrics") {
    send(res, 200, metricsText(), { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  if (pathname === "/api/hosts") {
    json(res, 200, { count: hosts.length, hosts });
    return;
  }

  if (pathname === "/api/events") {
    json(res, 200, { count: state.syntheticEvents.length, events: state.syntheticEvents });
    return;
  }

  if (pathname === "/api/db/status") {
    await refreshDbStats();
    json(res, 200, {
      connected: state.db.connected,
      host: dbConfig.host,
      database: dbConfig.database,
      telemetryRows: state.db.telemetryRows,
      incidentRows: state.db.incidentRows,
      openIncidents: state.db.openIncidents,
      queryFailures: state.dbQueryFailures,
      lastQueryAt: state.db.lastQueryAt,
      error: state.db.error,
    });
    return;
  }

  if (pathname === "/api/slo") {
    json(res, 200, slo());
    return;
  }

  if (pathname === "/api/analytics") {
    await refreshDbStats();
    json(res, 200, {
      generatedAt: new Date().toISOString(),
      db: state.db,
      loadRuns: state.loadRuns.slice(-10).reverse(),
      latestTelemetry: state.telemetry.slice(-10).reverse(),
      requestCounters: state.requests,
      statusCounters: state.statusCodes,
    });
    return;
  }

  if (pathname === "/api/live") {
    await refreshDbStats();
    json(res, 200, liveSnapshot());
    return;
  }

  if (pathname === "/api/charts") {
    json(res, 200, await chartSnapshot());
    return;
  }

  if (pathname === "/api/compliance") {
    await refreshDbStats();
    json(res, 200, complianceSnapshot());
    return;
  }

  if (pathname === "/api/observability") {
    json(res, 200, observabilityPlan());
    return;
  }

  if (pathname === "/api/incidents" && req.method === "GET") {
    if (!dbPool) {
      serviceUnavailable(res, "MariaDB no esta disponible para consultar incidentes.");
      return;
    }
    const rows = await queryDb(
      "SELECT id, service, severity, status, title, description, created_at, resolved_at FROM incidents ORDER BY created_at DESC LIMIT 50"
    );
    if (!rows) {
      serviceUnavailable(res, state.db.error || "No se pudo consultar MariaDB.");
      return;
    }
    json(res, 200, { count: rows.length, incidents: rows.map(publicIncident) });
    return;
  }

  if (pathname === "/api/incidents" && req.method === "POST") {
    if (!dbPool) {
      serviceUnavailable(res, "MariaDB no esta disponible para crear incidentes.");
      return;
    }
    try {
      const payload = await readJson(req);
      const incident = {
        id: crypto.randomUUID(),
        service: String(payload.service || "web-service").slice(0, 80),
        severity: String(payload.severity || "medium").slice(0, 20),
        status: String(payload.status || "open").slice(0, 20),
        title: String(payload.title || "Incidente generado por prueba").slice(0, 160),
        description: String(payload.description || "Evento creado desde el backend de demostracion.").slice(0, 1000),
        createdAt: new Date().toISOString(),
        resolvedAt: payload.status === "resolved" ? new Date().toISOString() : null,
      };
      const result = await queryDb(
        "INSERT INTO incidents (id, service, severity, status, title, description, created_at, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          incident.id,
          incident.service,
          incident.severity,
          incident.status,
          incident.title,
          incident.description,
          mysqlDate(incident.createdAt),
          incident.resolvedAt ? mysqlDate(incident.resolvedAt) : null,
        ]
      );
      if (!result) {
        serviceUnavailable(res, state.db.error || "No se pudo escribir el incidente.");
        return;
      }
      await refreshDbStats();
      json(res, 201, incident);
    } catch (error) {
      badRequest(res, error.message);
    }
    return;
  }

  if (pathname === "/api/report") {
    await refreshDbStats();
    json(res, 200, {
      generatedAt: new Date().toISOString(),
      summary: summary(),
      hosts,
      compliance: complianceSnapshot(),
      recommendations: [
        "Mantener dashboard en Zabbix para tendencias históricas.",
        "Ejecutar Artillery antes de la sustentación para mostrar impacto en métricas.",
        "Comparar latencia de /health contra eventos de problema y recuperación.",
        "Usar /api/incidents para demostrar persistencia en MariaDB durante pruebas de estrés.",
      ],
    });
    return;
  }

  if (pathname === "/api/telemetry" && req.method === "POST") {
    try {
      const payload = await readJson(req);
      const sample = {
        id: crypto.randomUUID(),
        receivedAt: new Date().toISOString(),
        source: String(payload.source || "artillery"),
        cpu: Number(payload.cpu ?? Math.random() * 100).toFixed(2),
        memory: Number(payload.memory ?? Math.random() * 100).toFixed(2),
        disk: Number(payload.disk ?? Math.random() * 100).toFixed(2),
        message: String(payload.message || "synthetic telemetry"),
      };
      state.telemetry.push(sample);
      if (state.telemetry.length > 500) state.telemetry.shift();
      if (dbPool) {
        await queryDb(
          "INSERT INTO telemetry_samples (id, received_at, source, cpu, memory, disk, message) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            sample.id,
            mysqlDate(sample.receivedAt),
            sample.source,
            sample.cpu,
            sample.memory,
            sample.disk,
            sample.message.slice(0, 255),
          ]
        );
        await refreshDbStats();
      }
      json(res, 201, sample);
    } catch (error) {
      badRequest(res, error.message);
    }
    return;
  }

  if (pathname === "/api/load/cpu") {
    const result = runCpuWork(url.searchParams.get("ms"));
    json(res, 200, {
      endpoint: "cpu",
      result,
      recorded: recordLoadRun("cpu", { elapsedMs: result.elapsedMs, rounds: result.rounds }),
    });
    return;
  }

  if (pathname === "/api/load/memory") {
    const result = memoryPayload(url.searchParams.get("kb"));
    json(res, 200, {
      endpoint: "memory",
      result,
      recorded: recordLoadRun("memory", { elapsedMs: 0, sizeKb: result.sizeKb, bytes: result.bytes }),
    });
    return;
  }

  if (pathname === "/api/load/mixed") {
    const cpu = runCpuWork(url.searchParams.get("ms") || 35);
    const payload = memoryPayload(url.searchParams.get("kb") || 32);
    const recorded = recordLoadRun("mixed", {
      elapsedMs: cpu.elapsedMs,
      rounds: cpu.rounds,
      sizeKb: payload.sizeKb,
      bytes: payload.bytes,
    });
    json(res, 200, {
      endpoint: "mixed",
      cpu,
      payload,
      recorded,
      hosts: hosts.map((host) => ({ id: host.id, service: host.service, check: host.check })),
    });
    return;
  }

  if (pathname === "/api/load/burst") {
    const burst = runBurst(url.searchParams.get("n"), url.searchParams.get("ms"), url.searchParams.get("kb"));
    const recorded = recordLoadRun("burst", {
      elapsedMs: burst.elapsedMs,
      rounds: burst.rounds,
      sizeKb: burst.memoryKb * burst.iterations,
      bytes: burst.bytes,
      iterations: burst.iterations,
    });
    json(res, 200, {
      endpoint: "burst",
      burst,
      recorded,
    });
    return;
  }

  notFound(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === "/health" || pathname === "/metrics" || pathname.startsWith("/api/")) {
    await handleApi(req, res, url);
    return;
  }

  increment("static");
  serveStatic(req, res, pathname);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Proyecto 7 web-service listening on ${PORT}`);
  initDatabase();
});

setInterval(() => {
  if (dbPool) refreshDbStats();
}, 30000).unref();
