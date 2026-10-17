// Used only for the single-page preview (VITE_PREVIEW=1). It answers /api calls inside the
// browser with the same shared/core.js the server uses. The real project uses server/index.js.
import { createCore, emptyDb } from "../shared/core.js";

const KEY = "mcsr_preview_db";
const core = createCore(window.crypto);
let db;
try { db = JSON.parse(localStorage.getItem(KEY)); } catch { /* start fresh */ }
db = db || emptyDb();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ } };
const ready = core.seed(db).then(save);

const realFetch = window.fetch.bind(window);
window.fetch = async (url, opts = {}) => {
  if (!String(url).startsWith("/api")) return realFetch(url, opts);
  await ready;
  const out = await core.handle(db, {
    method: (opts.method || "GET").toUpperCase(),
    path: String(url).slice(4),
    token: ((opts.headers || {}).Authorization || "").replace("Bearer ", ""),
    body: opts.body ? JSON.parse(opts.body) : {},
  });
  if (out.changed) save();
  return new Response(JSON.stringify(out.body), { status: out.status, headers: { "Content-Type": "application/json" } });
};
