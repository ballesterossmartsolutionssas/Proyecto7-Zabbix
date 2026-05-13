const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 80);
const PUBLIC_DIR = path.join(__dirname, "html");
const startedAt = Date.now();
const maxBodyBytes = 256 * 1024;

const state = {
  requests: {},
  telemetry: [],
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

function summary() {
  const memory = process.memoryUsage();
  const uptimeSeconds = Math.round((Date.now() - startedAt) / 1000);
  return {
    app: "Proyecto 7 Web Service",
    version: "1.1.0",
    environment: process.env.NODE_ENV || "development",
    status: "operativo",
    uptimeSeconds,
    startedAt: new Date(startedAt).toISOString(),
    hostsMonitored: hosts.length,
    telemetrySamples: state.telemetry.length,
    recentTelemetry: state.telemetry.slice(-5).reverse(),
    requests: state.requests,
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

  if (pathname === "/api/hosts") {
    json(res, 200, { count: hosts.length, hosts });
    return;
  }

  if (pathname === "/api/events") {
    json(res, 200, { count: state.syntheticEvents.length, events: state.syntheticEvents });
    return;
  }

  if (pathname === "/api/report") {
    json(res, 200, {
      generatedAt: new Date().toISOString(),
      summary: summary(),
      hosts,
      recommendations: [
        "Mantener dashboard en Zabbix para tendencias historicas.",
        "Ejecutar Artillery antes de la sustentacion para mostrar impacto en metricas.",
        "Comparar latencia de /health contra eventos de problema y recuperacion.",
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
      json(res, 201, sample);
    } catch (error) {
      badRequest(res, error.message);
    }
    return;
  }

  if (pathname === "/api/load/cpu") {
    json(res, 200, {
      endpoint: "cpu",
      result: runCpuWork(url.searchParams.get("ms")),
    });
    return;
  }

  if (pathname === "/api/load/memory") {
    json(res, 200, {
      endpoint: "memory",
      result: memoryPayload(url.searchParams.get("kb")),
    });
    return;
  }

  if (pathname === "/api/load/mixed") {
    const cpu = runCpuWork(url.searchParams.get("ms") || 35);
    const payload = memoryPayload(url.searchParams.get("kb") || 32);
    json(res, 200, {
      endpoint: "mixed",
      cpu,
      payload,
      hosts: hosts.map((host) => ({ id: host.id, service: host.service, check: host.check })),
    });
    return;
  }

  notFound(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === "/health" || pathname.startsWith("/api/")) {
    await handleApi(req, res, url);
    return;
  }

  increment("static");
  serveStatic(req, res, pathname);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Proyecto 7 web-service listening on ${PORT}`);
});
