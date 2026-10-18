// Vercel serverless entry point: every /api/... call is routed here and uses the same
// rules (shared/core.js) as the local Express server.
import { webcrypto } from "node:crypto";
import { createCore } from "../shared/core.js";
import { loadDb, saveDb, hydrateImages, health } from "../shared/persist.js";

const core = createCore(webcrypto);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    // vercel.json sends every /api/... call here with the rest of the path in ?path=
    const url = new URL(req.url, "http://localhost");
    const fromQuery = url.searchParams.get("path");
    const path = "/" + (fromQuery !== null ? fromQuery : url.pathname.replace(/^\/api\/?/, ""));
    if (path === "/health") return res.status(200).json(await health());

    const db = await loadDb(core);
    const out = await core.handle(db, {
      method: req.method,
      path,
      token: (req.headers.authorization || "").replace("Bearer ", ""),
      body: req.body && typeof req.body === "object" ? req.body : {},
    });
    if (out.changed) await saveDb(db);
    await hydrateImages(out.body);
    res.status(out.status).json(out.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "err.server", detail: String((err && err.message) || err).slice(0, 200) });
  }
}