import { useEffect, useState } from "react";
import * as api from "./api.js";
import Header from "./components/Header.jsx";
import AuthForm from "./components/AuthForm.jsx";
import CitizenDashboard from "./components/CitizenDashboard.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import { COUNTY } from "./config.js";
import { useLang } from "./i18n.jsx";

// Root component: restores the session from the server, then shows the citizen or admin screen.
export default function App() {
  const { t } = useLang();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [data, setData] = useState({ requests: [], queueTotal: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const u = await api.me();
        if (u) { setUser(u); setData(await api.listRequests()); }
      } catch (e) { setError(e.message); }
      setReady(true);
    })();
  }, []);

  const signedIn = async (u) => { setUser(u); setError(""); setData(await api.listRequests()); };
  const logout = async () => { await api.logout(); setUser(null); setData({ requests: [], queueTotal: 0 }); };

  // Runs a server action that returns the refreshed request list.
  const act = (fn) => async (...args) => {
    setError("");
    try { setData(await fn(...args)); }
    catch (e) {
      if (e.message === "err.auth") { api.clearToken(); setUser(null); }
      setError(e.message);
    }
  };

  if (!ready) return <p className="center">…</p>;

  return (
    <>
      <Header user={user} onLogout={logout} />
      <main className="container">
        {error && <p className="error center" role="alert">{t(error)}</p>}
        {!user && <AuthForm onAuth={signedIn} />}
        {user?.role === "citizen" && (
          <CitizenDashboard user={user} requests={data.requests} queueTotal={data.queueTotal}
            onCreate={act(api.createRequest)} onReadFeedback={act(api.markFeedbackRead)} />
        )}
        {user?.role === "admin" && (
          <AdminDashboard requests={data.requests} onStatus={act(api.updateStatus)} onFeedback={act(api.addFeedback)} />
        )}
      </main>
      <footer className="footer">{t("foot", { year: new Date().getFullYear(), phone: COUNTY.helpline })}</footer>
    </>
  );
}
