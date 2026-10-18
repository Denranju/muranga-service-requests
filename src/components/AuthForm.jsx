import { useState } from "react";
import * as store from "../api.js";
import Logo from "./Logo.jsx";
import PasswordField from "./PasswordField.jsx";
import PasswordStrength from "./PasswordStrength.jsx";
import { COUNTY } from "../config.js";
import { useLang } from "../i18n.jsx";

const BUTTONS = { login: "btn.login", register: "btn.sendCode", verify: "btn.verify", forgot: "btn.sendReset", reset: "btn.savePw" };

// Handles citizen login, registration with email verification, password reset and staff login.
export default function AuthForm({ onAuth }) {
  const { t } = useLang();
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("citizen"); // which login tab is open
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", confirm: "", code: "", staffNo: "", idNo: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mail, setMail] = useState(null); // the email just "sent": { to, code }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const go = (next) => { setMode(next); setError(""); setNotice(""); };
  const pickRole = (r) => { setRole(r); go("login"); };
  const show = (e) => (e.message.startsWith("err.") ? t(e.message) : e.message) + (e.detail ? ` [${e.detail}]` : "");
  const staff = mode === "login" && role === "admin";

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      if (staff) return onAuth(await store.loginStaff(f.email, f.staffNo, f.idNo));
      if (mode === "login") onAuth(await store.login(f.email, f.password));

      if (mode === "register") {
        if (f.password !== f.confirm) throw new Error("err.mismatch");
        setMail(await store.startRegistration(f));
        setF({ ...f, code: "" });
        go("verify");
      }
      if (mode === "verify") onAuth(await store.completeRegistration(f.email, f.code));

      if (mode === "forgot") {
        setMail(await store.requestReset(f.email));
        setF({ ...f, code: "", password: "", confirm: "" });
        go("reset");
      }
      if (mode === "reset") {
        if (f.password !== f.confirm) throw new Error("err.mismatch");
        await store.completeReset(f.email, f.code, f.password);
        setF({ ...f, password: "", confirm: "", code: "" });
        go("login");
        setNotice(t("msg.pwUpdated"));
      }
    } catch (err) { setError(show(err)); }
  }

  async function resend() {
    try { setMail(await store.resendCode(f.email.trim().toLowerCase(), mode === "verify" ? "register" : "reset")); setNotice(t("msg.newCode")); }
    catch (err) { setError(show(err)); }
  }

  return (
    <>
      <div className="hero">
        <Logo height={140} />
        <h2>{t("hero.title")}</h2>
        <p>{t("hero.sub")}</p>
        <p className="motto">{COUNTY.motto}</p>
      </div>

      <div className="auth card">
        {mode === "login" && (
          <div className="tabs" role="tablist">
            <button type="button" role="tab" aria-selected={role === "citizen"} className={role === "citizen" ? "on" : ""} onClick={() => pickRole("citizen")}>{t("tab.citizen")}</button>
            <button type="button" role="tab" aria-selected={role === "admin"} className={role === "admin" ? "on" : ""} onClick={() => pickRole("admin")}>{t("tab.admin")}</button>
          </div>
        )}
        <h2>{staff ? t("title.staff") : t("title." + mode)}</h2>
        <form onSubmit={submit}>
          {mode === "register" && (
            <>
              <label>{t("f.name")}<input required value={f.name} onChange={set("name")} /></label>
              <label>{t("f.phone")}<input required type="tel" value={f.phone} onChange={set("phone")} placeholder="07xx xxx xxx" /></label>
            </>
          )}

          {(mode === "login" || mode === "register" || mode === "forgot") && (
            <label>{t("f.email")}<input required type="email" value={f.email} onChange={set("email")} /></label>
          )}

          {staff && (
            <>
              <label>{t("f.staffNo")}<input required value={f.staffNo} onChange={set("staffNo")} placeholder="MCG-0001" autoComplete="off" /></label>
              <PasswordField label={t("f.idNo")} value={f.idNo} onChange={set("idNo")} autoComplete="off" />
            </>
          )}

          {(mode === "verify" || mode === "reset") && (
            <>
              <p className="muted">{t("msg.code", { email: f.email })}</p>
              {mail && (
                <div className="inbox" role="note">
                  <b>{t("msg.preview")}</b>
                  <div>{t("msg.to")}: {mail.to}</div>
                  <div>{t("msg.yourCode")} <span className="code">{mail.code}</span></div>
                </div>
              )}
              <label>{t("f.code")}<input required inputMode="numeric" maxLength="6" value={f.code} onChange={set("code")} placeholder="123456" /></label>
            </>
          )}

          {!staff && (mode === "login" || mode === "register" || mode === "reset") && (
            <PasswordField label={mode === "reset" ? t("f.newPassword") : t("f.password")} value={f.password} onChange={set("password")}
              autoComplete={mode === "login" ? "current-password" : "new-password"} />
          )}
          {(mode === "register" || mode === "reset") && (
            <>
              <PasswordStrength value={f.password} />
              <PasswordField label={t("f.confirm")} value={f.confirm} onChange={set("confirm")} autoComplete="new-password" />
            </>
          )}

          {notice && <p className="success" role="status">{notice}</p>}
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn" type="submit">{t(BUTTONS[mode])}</button>
        </form>

        {(mode === "verify" || mode === "reset") && (
          <p className="switch"><button className="link" onClick={resend}>{t("link.resend")}</button></p>
        )}
        {mode === "login" && role === "citizen" && (
          <p className="switch"><button className="link" onClick={() => go("forgot")}>{t("link.forgot")}</button></p>
        )}
        <p className="switch">
          {mode === "login" ? (role === "citizen" && <>{t("link.new")} <button className="link" onClick={() => go("register")}>{t("link.create")}</button></>)
            : (<>{t("link.back")} <button className="link" onClick={() => go("login")}>{t("title.login")}</button></>)}
        </p>
      </div>
    </>
  );
}
