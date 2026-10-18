import express from "express";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const immutableCache = "public, max-age=31536000, immutable";

export function createApp(staticDir: string) {
  const app = express();
  app.disable("x-powered-by");
  app.use((_request, response, next) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    response.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' https://www.youtube.com https://s.ytimg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://www.youtube.com; font-src 'self'; media-src 'self' blob:; frame-src https://www.youtube.com https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'none'");
    response.setHeader("Strict-Transport-Security", "max-age=31536000");
    next();
  });
  app.get("/api/health", (_request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.json({ ok: true, service: "portfolio", version: "0.6.0" });
  });
  app.use("/api", (_request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.status(404).json({ ok: false, error: "API route not found." });
  });
  // Only Vite's flat, fingerprinted JS/CSS filenames can use precompressed files.
  app.use("/assets", (request, response, next) => {
    if (!["GET", "HEAD"].includes(request.method) || !/^\/[\w-]+-[\w-]{8}\.(js|css)$/.test(request.path)) return next();
    response.vary("Accept-Encoding");
    const encoding = request.acceptsEncodings("br", "gzip", "identity");
    if (encoding !== "br" && encoding !== "gzip") return next();
    const file = resolve(staticDir, "assets", request.path.slice(1)) + (encoding === "br" ? ".br" : ".gz");
    if (!existsSync(file)) return next();
    response.type(request.path.endsWith(".css") ? "text/css" : "text/javascript");
    response.setHeader("Content-Encoding", encoding);
    response.setHeader("Cache-Control", immutableCache);
    response.sendFile(file, (error) => { if (error) next(error); });
  });
  app.use(express.static(staticDir, {
    dotfiles: "deny",
    etag: true,
    setHeaders(response, filePath) {
      response.setHeader("Cache-Control", filePath.startsWith(resolve(staticDir, "assets") + "/") && /-[\w-]{8}\.[a-z0-9]+$/.test(filePath) ? immutableCache : "no-cache");
    }
  }));
  // This portfolio uses hash navigation; missing files must stay real 404s.
  app.use((_request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.status(404).type("text").send("Not found");
  });
  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    console.error("Portfolio response failed", error instanceof Error ? error.name : "UnknownError");
    if (!response.headersSent) response.status(500).json({ ok: false, error: "Unexpected server error." });
  });
  return app;
}
