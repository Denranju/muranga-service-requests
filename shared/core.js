// Business rules for the whole system: accounts, verification codes, requests, queue, feedback.
// It works on a plain `db` object and knows nothing about files or HTTP, so the Express
// server (server/index.js) saves the db to data/db.json after each change.
import { CATEGORIES, SUB_COUNTIES, STATUSES } from "../src/config.js";

// Demo staff accounts. ID numbers here are placeholders: replace them with real ones.
export const STAFF_SEED = [
  { id: "u-staff-1", name: "County Administrator", email: "admin@muranga.go.ke", staffNo: "MCG-0001", idNo: "10000001" },
  { id: "u-staff-2", name: "Public Works Officer", email: "works@muranga.go.ke", staffNo: "MCG-0002", idNo: "10000002" },
  { id: "u-staff-3", name: "Water and Sanitation Officer", email: "water@muranga.go.ke", staffNo: "MCG-0003", idNo: "10000003" },
];

const CODE_MINUTES = 10;
const MAX_TRIES = 5;
const PASSWORD_RULES = [/.{8,}/, /[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/];

export const emptyDb = () => ({ users: [], requests: [], codes: {}, sessions: {} });

class ApiError extends Error {
  constructor(status, key) { super(key); this.status = status; }
}

const text = (v) => String(v ?? "").trim();
const isStrong = (p) => typeof p === "string" && PASSWORD_RULES.every((r) => r.test(p));
const publicUser = ({ password, idHash, ...user }) => user;

export function createCore(crypto) {
  const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const random = (bytes) => hex(crypto.getRandomValues(new Uint8Array(bytes)));

  // Passwords and ID numbers are stored as salted PBKDF2 hashes, never as plain text.
  async function derive(value, salt) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(value), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" }, key, 256);
    return hex(bits);
  }
  const protect = async (value) => { const salt = random(16); return `${salt}$${await derive(value, salt)}`; };
  const matches = async (value, stored) => {
    const [salt, digest] = String(stored || "").split("$");
    return Boolean(digest) && (await derive(String(value), salt)) === digest;
  };

  async function seed(db) {
    for (const s of STAFF_SEED) {
      if (db.users.some((u) => u.email === s.email)) continue;
      db.users.push({ id: s.id, name: s.name, email: s.email, staffNo: s.staffNo, phone: "", role: "admin", idHash: await protect(s.idNo) });
    }
  }

  const startSession = (db, user) => {
    const token = random(24);
    db.sessions[token] = user.id;
    return { token, user: publicUser(user) };
  };

  // Email codes. There is no mail server, so the code is returned to the screen as a preview.
  function issueCode(db, email, purpose, extra = {}) {
    const code = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
    db.codes[email] = { purpose, code, extra, tries: 0, expires: Date.now() + CODE_MINUTES * 60000 };
    return { to: email, code };
  }

  function consumeCode(db, email, purpose, code) {
    const entry = db.codes[email];
    if (!entry || entry.purpose !== purpose) throw new ApiError(400, "err.noCode");
    if (Date.now() > entry.expires) throw new ApiError(400, "err.expired");
    if (entry.tries >= MAX_TRIES) throw new ApiError(429, "err.tries");
    if (entry.code !== text(code)) { entry.tries += 1; throw new ApiError(400, "err.wrongCode"); }
    delete db.codes[email];
    return entry.extra;
  }

  // Queue: every unresolved request, served in the order it was submitted.
  function requestsFor(db, user) {
    const open = db.requests
      .filter((r) => r.status !== "Resolved")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt) || a.id.localeCompare(b.id));
    const position = {};
    open.forEach((r, i) => { position[r.id] = i + 1; });
    const visible = user.role === "admin" ? db.requests : db.requests.filter((r) => r.userId === user.id);
    return { requests: visible.map((r) => ({ ...r, position: position[r.id] || null })), queueTotal: open.length };
  }

  async function route(db, { method, path, token, body }) {
    const me = db.users.find((u) => u.id === db.sessions[token]);
    const need = (role) => {
      if (!me || (role && me.role !== role)) throw new ApiError(me ? 403 : 401, "err.auth");
      return me;
    };
    const key = `${method} ${path.replace(/\/$/, "")}`;
    const email = text(body.email).toLowerCase();

    if (key === "POST /register/start") {
      if (!isStrong(body.password)) throw new ApiError(400, "err.weak");
      if (db.users.some((u) => u.email === email)) throw new ApiError(409, "err.exists");
      if (!text(body.name) || !email) throw new ApiError(400, "err.server");
      return issueCode(db, email, "register", { name: text(body.name), phone: text(body.phone), password: await protect(body.password) });
    }
    if (key === "POST /register/verify") {
      const { name, phone, password } = consumeCode(db, email, "register", body.code);
      const user = { id: "u-" + random(6), name, email, phone, role: "citizen", password };
      db.users.push(user);
      return startSession(db, user);
    }
    if (key === "POST /code/resend") {
      const purpose = body.purpose === "reset" ? "reset" : "register";
      const entry = db.codes[email];
      if (!entry || entry.purpose !== purpose) throw new ApiError(400, "err.noCode");
      return issueCode(db, email, purpose, entry.extra);
    }
    if (key === "POST /reset/request") {
      if (!db.users.some((u) => u.email === email && u.role === "citizen")) throw new ApiError(404, "err.noAccountReset");
      return issueCode(db, email, "reset");
    }
    if (key === "POST /reset/complete") {
      if (!isStrong(body.password)) throw new ApiError(400, "err.weak");
      consumeCode(db, email, "reset", body.code);
      db.users.find((u) => u.email === email).password = await protect(body.password);
      return { ok: true };
    }
    if (key === "POST /login") {
      const user = db.users.find((u) => u.email === email);
      if (!user) throw new ApiError(404, "err.noAccount");
      if (user.role === "admin") throw new ApiError(403, "err.isStaff");
      if (!(await matches(body.password, user.password))) throw new ApiError(401, "err.wrongPw");
      return startSession(db, user);
    }
    if (key === "POST /staff/login") {
      const user = db.users.find((u) => u.email === email);
      if (!user) throw new ApiError(404, "err.noStaff");
      if (user.role !== "admin") throw new ApiError(403, "err.notStaff");
      const sameNo = user.staffNo.toLowerCase() === text(body.staffNo).toLowerCase();
      if (!sameNo || !(await matches(text(body.idNo), user.idHash))) throw new ApiError(401, "err.badStaff");
      return startSession(db, user);
    }
    if (key === "POST /logout") { delete db.sessions[token]; return { ok: true }; }
    if (key === "GET /me") return { user: publicUser(need()) };

    if (key === "GET /requests") return requestsFor(db, need());
    if (key === "POST /requests") {
      const user = need("citizen");
      const category = text(body.category), subCounty = text(body.subCounty);
      if (!CATEGORIES.includes(category) || !SUB_COUNTIES.includes(subCounty) || !text(body.location)) throw new ApiError(400, "err.server");
      if (text(body.description).length < 10) throw new ApiError(400, "err.desc");
      const image = typeof body.image === "string" && body.image.startsWith("data:image/") && body.image.length < 700000 ? body.image : "";
      const now = new Date().toISOString();
      db.requests.unshift({
        id: "MSR-" + String(db.requests.length + 1).padStart(4, "0"),
        userId: user.id, userName: user.name, category, subCounty,
        location: text(body.location), description: text(body.description), image,
        status: "Pending", createdAt: now, history: [{ status: "Pending", at: now, note: "Request submitted" }], feedback: [],
      });
      return requestsFor(db, user);
    }
    if (key === "POST /feedback/read") {
      const user = need("citizen");
      db.requests.filter((r) => r.userId === user.id).forEach((r) => (r.feedback || []).forEach((f) => { f.read = true; }));
      return requestsFor(db, user);
    }

    const item = path.match(/^\/requests\/([\w-]+)\/(status|feedback)$/);
    if (item && method !== "GET") {
      const user = need("admin");
      const req = db.requests.find((r) => r.id === item[1]);
      if (!req) throw new ApiError(404, "err.server");
      const at = new Date().toISOString();
      if (item[2] === "status") {
        if (!STATUSES.includes(body.status)) throw new ApiError(400, "err.server");
        req.status = body.status;
        req.history.push({ status: body.status, at, note: `Marked ${body.status}` });
      } else {
        const message = text(body.message).slice(0, 500);
        if (!message) throw new ApiError(400, "err.server");
        (req.feedback ||= []).push({ id: "f-" + random(4), by: user.name, at, message, read: false });
      }
      return requestsFor(db, user);
    }

    if (key === "GET /staff") { need("admin"); return { staff: db.users.filter((u) => u.role === "admin").map(publicUser) }; }
    if (key === "POST /staff") {
      need("admin");
      const staffNo = text(body.staffNo), idNo = text(body.idNo);
      if (!/^\d{7,8}$/.test(idNo)) throw new ApiError(400, "err.idFormat");
      if (!text(body.name) || !email || !staffNo) throw new ApiError(400, "err.server");
      if (db.users.some((u) => u.email === email || (u.staffNo || "").toLowerCase() === staffNo.toLowerCase())) throw new ApiError(409, "err.dupStaff");
      db.users.push({ id: "u-staff-" + random(4), name: text(body.name), email, staffNo, phone: "", role: "admin", idHash: await protect(idNo) });
      return { staff: db.users.filter((u) => u.role === "admin").map(publicUser) };
    }
    throw new ApiError(404, "err.server");
  }

  // Returns { status, body, changed }; `changed` tells the caller to save the db.
  async function handle(db, request) {
    try {
      const body = await route(db, { ...request, path: request.path.replace(/\/$/, "") || "/" });
      return { status: 200, body, changed: request.method !== "GET" };
    } catch (err) {
      if (err instanceof ApiError) return { status: err.status, body: { error: err.message }, changed: request.method !== "GET" };
      console.error(err);
      return { status: 500, body: { error: "err.server" }, changed: false };
    }
  }

  return { handle, seed };
}
