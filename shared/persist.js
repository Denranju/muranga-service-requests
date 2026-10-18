// Storage used on Vercel, where files cannot be written. Data is kept in Upstash Redis
// (added from the Vercel dashboard). Without Redis it falls back to memory, which is
// wiped whenever Vercel restarts the function, so it is only good for a quick look.
import { emptyDb } from "./core.js";

// Vercel adds the Redis settings with a prefix chosen at install time (KV_, UPSTASH_, ...),
// so look for any variable that ends the right way instead of one exact name.
const find = (pattern) => Object.keys(process.env).find((k) => pattern.test(k) && !/READ_ONLY/.test(k));
const urlName = find(/(REST_API_URL|REDIS_REST_URL)$/);
const tokenName = find(/(REST_API_TOKEN|REDIS_REST_TOKEN)$/);
const rawUrl = urlName ? process.env[urlName] : "";
const URL_ = rawUrl && !rawUrl.startsWith("http") ? `https://${rawUrl}` : rawUrl;
const TOKEN = tokenName ? process.env[tokenName] : "";
export const usingRedis = Boolean(URL_ && TOKEN);

const DB_KEY = "mcsr:db";
const IMAGE_PREFIX = "mcsr:img:";
let memory = null;

async function pipeline(commands) {
  const res = await fetch(`${URL_}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error("storage unavailable");
  return res.json();
}

export async function loadDb(core) {
  if (!usingRedis) {
    if (!memory) { memory = emptyDb(); await core.seed(memory); }
    return memory;
  }
  const [{ result }] = await pipeline([["GET", DB_KEY]]);
  if (result) return { ...emptyDb(), ...JSON.parse(result) };
  const db = emptyDb();
  await core.seed(db);
  await saveDb(db);
  return db;
}

// Photos are stored under their own keys so the main record stays small.
export async function saveDb(db) {
  if (!usingRedis) return;
  const commands = [];
  db.requests.forEach((r) => {
    if (r.image && r.image.startsWith("data:")) {
      commands.push(["SET", IMAGE_PREFIX + r.id, r.image]);
      r.image = "@";
    }
  });
  await pipeline([["SET", DB_KEY, JSON.stringify(db)], ...commands]);
}

// Puts the stored photos back into a response before it is sent to the browser.
export async function hydrateImages(body) {
  if (!usingRedis || !body.requests) return;
  const stored = body.requests.filter((r) => r.image === "@");
  if (!stored.length) return;
  const [{ result }] = await pipeline([["MGET", ...stored.map((r) => IMAGE_PREFIX + r.id)]]);
  stored.forEach((r, i) => { r.image = result[i] || ""; });
}

// Used by /api/health: shows which settings were found (names only, never the values).
export async function health() {
  const info = { storage: usingRedis ? "redis" : "memory", urlVariable: urlName || null, tokenVariable: tokenName || null };
  if (!usingRedis) return { ok: true, ...info, note: "No Redis settings found: data is not saved between restarts." };
  try {
    const [{ result }] = await pipeline([["PING"]]);
    return { ok: result === "PONG", ...info, redisReachable: result === "PONG" };
  } catch (err) {
    return { ok: false, ...info, redisReachable: false, detail: String(err.message).slice(0, 200) };
  }
}
