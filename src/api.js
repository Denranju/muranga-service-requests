// Talks to the server (/api). The login token is the only thing kept in the browser.
const TOKEN_KEY = "mcsr_token";
const token = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
const setToken = (v) => { try { v ? localStorage.setItem(TOKEN_KEY, v) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } };

async function call(method, path, body) {
  let res;
  try {
    res = await fetch("/api" + path, {
      method,
      headers: { "Content-Type": "application/json", ...(token() ? { Authorization: `Bearer ${token()}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch { throw new Error("err.network"); }
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const error = new Error(data.error || "err.server");
    error.detail = data.detail;
    throw error;
  }
  return data;
}

const session = ({ token: t, user }) => { setToken(t); return user; };

export const login = async (email, password) => session(await call("POST", "/login", { email, password }));
export const loginStaff = async (email, staffNo, idNo) => session(await call("POST", "/staff/login", { email, staffNo, idNo }));
export const startRegistration = (f) => call("POST", "/register/start", { name: f.name, email: f.email, phone: f.phone, password: f.password });
export const resendCode = (email, purpose) => call("POST", "/code/resend", { email, purpose });
export const completeRegistration = async (email, code) => session(await call("POST", "/register/verify", { email, code }));
export const requestReset = (email) => call("POST", "/reset/request", { email });
export const completeReset = (email, code, password) => call("POST", "/reset/complete", { email, code, password });

export async function me() {
  if (!token()) return null;
  try { return (await call("GET", "/me")).user; }
  catch (e) { if (e.message === "err.auth") { setToken(null); return null; } throw e; }
}
export async function logout() { try { await call("POST", "/logout"); } catch { /* ignore */ } setToken(null); }
export const clearToken = () => setToken(null);

// Each of these returns { requests, queueTotal } for the logged-in user.
export const listRequests = () => call("GET", "/requests");
export const createRequest = (data) => call("POST", "/requests", data);
export const updateStatus = (id, status) => call("PATCH", `/requests/${id}/status`, { status });
export const addFeedback = (id, message) => call("POST", `/requests/${id}/feedback`, { message });
export const markFeedbackRead = () => call("POST", "/feedback/read", {});

export const listStaff = async () => (await call("GET", "/staff")).staff;
export const addStaff = async (f) => (await call("POST", "/staff", f)).staff;
