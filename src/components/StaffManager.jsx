import { useEffect, useState } from "react";
import * as api from "../api.js";
import { useLang } from "../i18n.jsx";

// Lets an admin add more staff, who can then log in with email, personal number and ID number.
export default function StaffManager() {
  const { t } = useLang();
  const [staff, setStaff] = useState([]);
  const [f, setF] = useState({ name: "", email: "", staffNo: "", idNo: "" });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { api.listStaff().then(setStaff).catch(() => {}); }, []);

  async function add(e) {
    e.preventDefault();
    try {
      setStaff(await api.addStaff(f));
      setF({ name: "", email: "", staffNo: "", idNo: "" });
      setMsg({ type: "success", text: t("sm.added") });
    } catch (err) { setMsg({ type: "error", text: t(err.message) }); }
  }

  return (
    <section className="card">
      <h3>{t("sm.title")} ({staff.length})</h3>
      <p className="muted">{t("sm.note")}</p>
      <div className="table-wrap">
        <table className="qtable">
          <thead><tr><th>{t("f.name")}</th><th>{t("f.staffNo")}</th><th>{t("f.email")}</th></tr></thead>
          <tbody>{staff.map((s) => <tr key={s.id}><td>{s.name}</td><td>{s.staffNo}</td><td>{s.email}</td></tr>)}</tbody>
        </table>
      </div>
      <form className="staff-form" onSubmit={add}>
        <h4>{t("sm.add")}</h4>
        <div className="row">
          <label>{t("f.name")}<input required value={f.name} onChange={set("name")} /></label>
          <label>{t("f.email")}<input required type="email" value={f.email} onChange={set("email")} /></label>
        </div>
        <div className="row">
          <label>{t("f.staffNo")}<input required value={f.staffNo} onChange={set("staffNo")} placeholder="MCG-0004" /></label>
          <label>{t("f.idNo")}<input required inputMode="numeric" value={f.idNo} onChange={set("idNo")} /></label>
        </div>
        {msg.text && <p className={msg.type} role="status">{msg.text}</p>}
        <button className="btn small" type="submit">{t("sm.btn")}</button>
      </form>
    </section>
  );
}
