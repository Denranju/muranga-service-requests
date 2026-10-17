import { CATEGORIES, STATUSES } from "../config.js";
import { useLang } from "../i18n.jsx";

// Summary figures: totals, open vs resolved, and a count per category.
export default function Analytics({ requests }) {
  const { t } = useLang();
  const count = (s) => requests.filter((r) => r.status === s).length;
  const resolved = count("Resolved");
  const open = requests.length - resolved;
  const rate = requests.length ? Math.round((resolved / requests.length) * 100) : 0;
  const max = Math.max(1, ...CATEGORIES.map((c) => requests.filter((r) => r.category === c).length));

  return (
    <section>
      <div className="stats">
        <div className="stat"><b>{requests.length}</b><span>{t("an.total")}</span></div>
        <div className="stat open"><b>{open}</b><span>{t("an.open")}</span></div>
        <div className="stat done"><b>{resolved}</b><span>{t("an.resolved")}</span></div>
        <div className="stat"><b>{rate}%</b><span>{t("an.rate")}</span></div>
      </div>
      <div className="card">
        <h3>{t("an.vs")}</h3>
        <div className="bar big">
          <div className="seg s-pending" style={{ flex: count("Pending") }} title={t("s.Pending")} />
          <div className="seg s-progress" style={{ flex: count("In Progress") }} title={t("s.In Progress")} />
          <div className="seg s-resolved" style={{ flex: resolved }} title={t("s.Resolved")} />
        </div>
        <p className="muted">{STATUSES.map((s) => `${t("s." + s)}: ${count(s)}`).join("  ·  ")}</p>
        <h3>{t("an.bycat")}</h3>
        {CATEGORIES.map((c) => {
          const n = requests.filter((r) => r.category === c).length;
          return (
            <div className="catrow" key={c}>
              <span>{t("cat." + c)}</span>
              <div className="bar"><div className="fill" style={{ width: `${(n / max) * 100}%` }} /></div>
              <b>{n}</b>
            </div>
          );
        })}
      </div>
    </section>
  );
}
