import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Server } from "node:http";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { createApp } from "../server/app.ts";

let server: Server;
let root: string;
let origin: string;
before(async () => {
  root = await mkdtemp(join(tmpdir(), "portfolio-test-"));
  await mkdir(join(root, "assets"));
  await writeFile(join(root, "index.html"), "<!doctype html><title>Portfolio</title>");
  await writeFile(join(root, "assets", "index-AbCd1234.js"), "export {};");
  await writeFile(join(root, "assets", "index-AbCd1234.js.br"), brotliCompressSync("export {};"));
  await writeFile(join(root, "assets", "index-AbCd1234.js.gz"), gzipSync("export {};"));
  await writeFile(join(root, "assets", "storefront.webp"), "unversioned preview");
  server = createApp(root).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert(address && typeof address !== "string");
  origin = `http://127.0.0.1:${address.port}`;
});
after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await rm(root, { recursive: true, force: true });
});

test("health returns a versioned, uncached deployment check", async () => {
  const response = await fetch(`${origin}/api/health`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { ok: true, service: "portfolio", version: "0.6.0" });
});

test("HTML revalidates while only fingerprinted assets get immutable caching", async () => {
  const html = await fetch(origin);
  const hashed = await fetch(`${origin}/assets/index-AbCd1234.js`);
  const preview = await fetch(`${origin}/assets/storefront.webp`);
  assert.equal(html.status, 200);
  assert.equal(html.headers.get("cache-control"), "no-cache");
  assert.equal(hashed.headers.get("cache-control"), "public, max-age=31536000, immutable");
  assert.equal(preview.headers.get("cache-control"), "no-cache");
});

test("security headers prevent framing, sniffing, form posts, and arbitrary scripts", async () => {
  const response = await fetch(origin);
  assert.equal(response.headers.get("x-powered-by"), null);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("strict-transport-security"), "max-age=31536000");
  const policy = response.headers.get("content-security-policy") ?? "";
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /form-action 'none'/);
  assert(!policy.includes("unsafe-eval"));
  assert(!policy.includes("script-src 'self' 'unsafe-inline'"));
});

test("Brotli, gzip, and identity deliver the same script with correct negotiation", async () => {
  for (const encoding of ["br", "gzip", "identity", "br;q=0,gzip;q=0,identity;q=1"]) {
    const response = await fetch(`${origin}/assets/index-AbCd1234.js`, { headers: { "Accept-Encoding": encoding } });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "export {};");
    assert.equal(response.headers.get("content-encoding"), encoding === "br" || encoding === "gzip" ? encoding : null);
    assert.equal(response.headers.get("vary"), "Accept-Encoding");
    assert.match(response.headers.get("content-type") ?? "", /javascript/);
    assert.equal(response.headers.get("cache-control"), "public, max-age=31536000, immutable");
  }
});

test("retired contact and content endpoints cannot accept or expose personal data", async () => {
  const contact = await fetch(`${origin}/api/contact`, { method: "POST", headers: { "content-type": "application/json", origin: "https://example.com" }, body: JSON.stringify({ name: "Visitor", email: "visitor@example.com", message: "A message" }) });
  assert.equal(contact.status, 404);
  assert.equal(contact.headers.get("access-control-allow-origin"), null);
  assert.deepEqual(await contact.json(), { ok: false, error: "API route not found." });
  assert.equal((await fetch(`${origin}/api/projects`)).status, 404);
});

test("missing assets and hidden/server files stay 404s instead of returning the SPA", async () => {
  for (const path of ["/assets/missing.js", "/.env", "/.git/config", "/server/data/portfolio.sqlite", "/server/index.ts", "/missing"]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 404, path);
    assert.equal(await response.text(), "Not found");
  }
});
