import { useLang } from "../i18n.jsx";

// Admin view of the whole queue: every open request in the order it will be served.
export default function QueueTable({ requests, onStatus }) {
  const { t } = useLang();
  const rows = requests.filter((r) => r.position).sort((a, b) => a.position - b.position);

  const waiting = (iso) => {
    const mins = Math.max(1, Math.round((Date.now() - new Date(iso)) / 60000));
    if (mins < 60) return `${mins} ${t("u.min")}`;
    if (mins < 1440) return `${Math.round(mins / 60)} ${t("u.hr")}`;
    return `${Math.round(mins / 1440)} ${t("u.day")}`;
  };

  return (
    <section className="card">
      <h3>{t("qt.title", { n: rows.length })}</h3>
      {rows.length === 0 ? <p className="muted">{t("qt.empty")}</p> : (
        <div className="table-wrap">
          <table className="qtable">
            <thead><tr><th>#</th><th>{t("qt.ref")}</th><th>{t("r.category")}</th><th>{t("r.subCounty")}</th><th>{t("qt.citizen")}</th><th>{t("qt.waiting")}</th><th>{t("qt.status")}</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><b>{r.position}</b></td><td>{r.id}</td><td>{t("cat." + r.category)}</td><td>{r.subCounty}</td>
                  <td>{r.userName}</td><td>{waiting(r.createdAt)}</td><td>{t("s." + r.status)}</td>
                  <td>{r.status === "Pending" && <button className="btn small" onClick={() => onStatus(r.id, "In Progress")}>{t("qt.start")}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
