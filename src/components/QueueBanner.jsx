import { useLang } from "../i18n.jsx";

// Shown at the top of the resident dashboard: where each of their requests is in the queue.
export default function QueueBanner({ requests, total }) {
  const { t } = useLang();
  const open = requests.filter((r) => r.position).sort((a, b) => a.position - b.position);

  return (
    <section className="queue card" aria-label={t("q.title")}>
      <div className="queue-head">
        <h3>{t("q.title")}</h3>
        <span className="muted">{t("q.open", { n: total })}</span>
      </div>
      {open.length === 0 ? (
        <p className="muted">{t("q.empty")}</p>
      ) : (
        open.map((r) => {
          const pct = Math.round(((total - r.position + 1) / total) * 100);
          return (
            <div className="queue-row" key={r.id}>
              <div className="queue-pos"><b>#{r.position}</b><span>{t("q.of")} {total}</span></div>
              <div className="queue-info">
                <strong>{r.id}</strong> · {t("cat." + r.category)}
                <div className="muted">
                  {r.status === "In Progress" ? t("q.working") + " " : ""}
                  {r.position === 1 ? t("q.next") : t("q.ahead", { n: r.position - 1 })}
                </div>
                <div className="bar"><div className="fill" style={{ width: `${pct}%` }} /></div>
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}
