import cors from "cors";
import express from "express";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { projects } from "../src/data/projects.ts";

const app = express();
const port = Number(process.env.PORT || 5174);
const currentDir = dirname(fileURLToPath(import.meta.url));
const databaseDir = resolve(currentDir, "data");
const contactWindowMs = 15 * 60 * 1000;
const contactLimit = 5;
const contactAttempts = new Map<string, number[]>();

mkdirSync(databaseDir, { recursive: true });
const db = new DatabaseSync(resolve(databaseDir, "portfolio.sqlite"));

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA synchronous = NORMAL;");
db.exec("PRAGMA busy_timeout = 3000;");
db.exec(`
  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' https://www.youtube.com https://s.ytimg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://www.youtube.com; font-src 'self' data:; media-src 'self' blob:; frame-src https://www.youtube.com https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
  next();
});
app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_request, response) => {
  response.setHeader("Cache-Control", "no-store");
  response.json({ ok: true, service: "portfolio-api" });
});

app.get("/api/projects", (_request, response) => {
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.json(projects);
});

const insertContact = db.prepare("INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)");

app.post("/api/contact", (request, response) => {
  const { name, email, message, company } = request.body ?? {};

  // Honeypot bots receive a generic success response without writing to the database.
  if (typeof company === "string" && company.trim().length > 0) {
    response.status(201).json({ ok: true });
    return;
  }

  const now = Date.now();
  const requester = request.ip || request.socket.remoteAddress || "unknown";
  const recentAttempts = (contactAttempts.get(requester) ?? []).filter((timestamp) => now - timestamp < contactWindowMs);
  if (recentAttempts.length >= contactLimit) {
    response.setHeader("Retry-After", String(Math.ceil(contactWindowMs / 1000)));
    response.status(429).json({ ok: false, error: "Too many messages. Please try again later." });
    return;
  }

  if (![name, email, message].every((value) => typeof value === "string" && value.trim().length > 0)) {
    response.status(400).json({ ok: false, error: "Name, email, and message are required." });
    return;
  }

  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim();
  const cleanMessage = String(message).trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (cleanName.length > 100 || cleanEmail.length > 200 || cleanMessage.length > 4000) {
    response.status(400).json({ ok: false, error: "One or more fields are too long." });
    return;
  }
  if (!emailPattern.test(cleanEmail)) {
    response.status(400).json({ ok: false, error: "Enter a valid email address." });
    return;
  }

  recentAttempts.push(now);
  contactAttempts.set(requester, recentAttempts);
  try {
    insertContact.run(cleanName, cleanEmail, cleanMessage);
    response.status(201).json({ ok: true });
  } catch (error) {
    console.error("Contact message insert failed", error);
    response.status(503).json({ ok: false, error: "Contact storage is temporarily unavailable." });
  }
});

app.use("/api", (_request, response) => {
  response.status(404).json({ ok: false, error: "API route not found." });
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled portfolio server error", error);
  if (!response.headersSent) response.status(500).json({ ok: false, error: "Unexpected server error." });
});

const staticDir = resolve(currentDir, "../dist");
app.use(
  express.static(staticDir, {
    maxAge: "1h",
    etag: true,
    setHeaders(response, filePath) {
      if (filePath.endsWith("index.html")) {
        response.setHeader("Cache-Control", "no-store, max-age=0");
      }
    }
  })
);
app.use((_request, response) => {
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.sendFile(resolve(staticDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Portfolio server listening on http://localhost:${port}`);
});
