// Small Express server. All data is kept in data/db.json.
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { webcrypto } from "node:crypto";
import { createCore, emptyDb } from "../shared/core.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_FILE = process.env.DATA_FILE || path.join(root, "data", "db.json");
const PORT = process.env.PORT || 3001;

const core = createCore(webcrypto);

function load() {
  try { return { ...emptyDb(), ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) }; }
  catch { return emptyDb(); }
}

// Write to a temporary file first so a crash can never leave a half-written db.json.
function save(db) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

const db = load();
await core.seed(db);
save(db);

const app = express();
app.use(express.json({ limit: "2mb" }));

app.all("/api/*", async (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const out = await core.handle(db, { method: req.method, path: req.path.slice(4), token, body: req.body || {} });
  if (out.changed) save(db);
  res.status(out.status).json(out.body);
});

// After `npm run build` the same server also serves the web app.
const dist = path.join(root, "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => console.log(`Murang'a service requests running on http://localhost:${PORT}  (data: ${DATA_FILE})`));
