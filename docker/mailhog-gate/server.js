const crypto = require("crypto");
const http = require("http");
const { URL, URLSearchParams } = require("url");

const PORT = Number(process.env.PORT || 8080);
const TARGET = new URL(process.env.MAILHOG_TARGET || "http://mailhog:8025");
const USERNAME = process.env.MAILHOG_GATE_USERNAME || "admin";
const PASSWORD = process.env.MAILHOG_GATE_PASSWORD || "MailUAO2026!";
const SESSION_SECRET = process.env.MAILHOG_GATE_SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const COOKIE_NAME = "mailhog_gate";
const SESSION_TTL_SECONDS = Number(process.env.MAILHOG_GATE_SESSION_TTL_SECONDS || 8 * 60 * 60);

function timingSafeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(value) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

function createSession() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const nonce = crypto.randomBytes(12).toString("base64url");
  const payload = `${expires}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

function isValidSession(cookieHeader = "") {
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const index = cookie.indexOf("=");
        return index === -1 ? [cookie, ""] : [cookie.slice(0, index), decodeURIComponent(cookie.slice(index + 1))];
      }),
  );
  const token = cookies[COOKIE_NAME];
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = sign(payload);
  const expires = Number(parts[0]);

  return Number.isFinite(expires) && expires > Date.now() / 1000 && timingSafeEqual(parts[2], expected);
}

function sendLogin(res, statusCode = 200, error = "") {
  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MailHog | Proyecto 7</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0f172a;
      color: #172033;
    }

    * { box-sizing: border-box; }

    body {
      min-height: 100vh;
      margin: 0;
      display: grid;
      place-items: center;
      background:
        radial-gradient(circle at 18% 18%, rgba(20, 184, 166, 0.32), transparent 28rem),
        radial-gradient(circle at 82% 16%, rgba(250, 204, 21, 0.22), transparent 24rem),
        linear-gradient(135deg, #0f172a 0%, #111827 54%, #1f2937 100%);
      padding: 24px;
    }

    main {
      width: min(100%, 420px);
      background: #ffffff;
      border: 1px solid rgba(15, 23, 42, 0.12);
      border-radius: 8px;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
      overflow: hidden;
    }

    header {
      padding: 28px 30px 18px;
      border-bottom: 1px solid #e5e7eb;
    }

    .eyebrow {
      margin: 0 0 8px;
      color: #0f766e;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      color: #111827;
      font-size: 26px;
      line-height: 1.15;
      letter-spacing: 0;
    }

    .sub {
      margin: 10px 0 0;
      color: #64748b;
      font-size: 14px;
      line-height: 1.5;
    }

    form {
      display: grid;
      gap: 16px;
      padding: 24px 30px 30px;
    }

    label {
      display: grid;
      gap: 7px;
      color: #334155;
      font-size: 13px;
      font-weight: 700;
    }

    input {
      width: 100%;
      height: 44px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0 12px;
      color: #111827;
      font: inherit;
      outline: none;
      transition: border-color 120ms ease, box-shadow 120ms ease;
    }

    input:focus {
      border-color: #0f766e;
      box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.16);
    }

    .error {
      min-height: 20px;
      color: #b91c1c;
      font-size: 13px;
      font-weight: 700;
    }

    button {
      height: 46px;
      border: 0;
      border-radius: 6px;
      background: #0f766e;
      color: #ffffff;
      font: inherit;
      font-weight: 800;
      cursor: pointer;
      transition: background 120ms ease, transform 120ms ease;
    }

    button:hover { background: #115e59; }
    button:active { transform: translateY(1px); }
  </style>
</head>
<body>
  <main>
    <header>
      <p class="eyebrow">Proyecto 7</p>
      <h1>Acceso a MailHog</h1>
      <p class="sub">Bandeja de alertas generadas por Zabbix para la demo de monitoreo.</p>
    </header>
    <form method="post" action="/login">
      <label>
        Usuario
        <input name="username" autocomplete="username" required autofocus>
      </label>
      <label>
        Contrasena
        <input name="password" type="password" autocomplete="current-password" required>
      </label>
      <div class="error">${error}</div>
      <button type="submit">Entrar a MailHog</button>
    </form>
  </main>
</body>
</html>`);
}

function redirect(res, location) {
  res.writeHead(303, { Location: location });
  res.end();
}

function handleLogin(req, res) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 16_384) req.destroy();
  });
  req.on("end", () => {
    const params = new URLSearchParams(body);
    const username = params.get("username") || "";
    const password = params.get("password") || "";

    if (!timingSafeEqual(username, USERNAME) || !timingSafeEqual(password, PASSWORD)) {
      sendLogin(res, 401, "Usuario o contrasena incorrectos.");
      return;
    }

    const cookie = `${COOKIE_NAME}=${encodeURIComponent(createSession())}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
    res.writeHead(303, { "Set-Cookie": cookie, Location: "/" });
    res.end();
  });
}

function handleLogout(res) {
  res.writeHead(303, {
    "Set-Cookie": `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    Location: "/login",
  });
  res.end();
}

function proxyToMailhog(req, res) {
  const targetPath = req.url || "/";
  const headers = { ...req.headers, host: TARGET.host };
  delete headers.cookie;

  const proxyReq = http.request(
    {
      protocol: TARGET.protocol,
      hostname: TARGET.hostname,
      port: TARGET.port || 80,
      method: req.method,
      path: targetPath,
      headers,
    },
    (proxyRes) => {
      const responseHeaders = { ...proxyRes.headers };
      delete responseHeaders["www-authenticate"];
      res.writeHead(proxyRes.statusCode || 502, responseHeaders);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on("error", () => {
    res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("No se pudo conectar con MailHog.");
  });

  req.pipe(proxyReq);
}

http
  .createServer((req, res) => {
    if (req.url === "/healthz") {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("ok");
      return;
    }

    if (req.url === "/login" && req.method === "GET") {
      sendLogin(res);
      return;
    }

    if (req.url === "/login" && req.method === "POST") {
      handleLogin(req, res);
      return;
    }

    if (req.url === "/logout") {
      handleLogout(res);
      return;
    }

    if (!isValidSession(req.headers.cookie)) {
      redirect(res, "/login");
      return;
    }

    proxyToMailhog(req, res);
  })
  .listen(PORT, "0.0.0.0", () => {
    console.log(`MailHog gate listening on ${PORT}, proxying ${TARGET.href}`);
  });
