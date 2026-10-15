import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.ts";

const staticDir = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");
const port = Number(process.env.PORT || 5174);
createApp(staticDir).listen(port, "0.0.0.0", () => {
  console.log(`Portfolio server listening on http://localhost:${port}`);
});
