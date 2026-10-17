import { useState } from "react";
import { STATUSES, CATEGORIES } from "../config.js";
import Analytics from "./Analytics.jsx";
import RequestCard from "./RequestCard.jsx";
import QueueTable from "./QueueTable.jsx";
import StaffManager from "./StaffManager.jsx";
import { useLang } from "../i18n.jsx";

function exportCsv(rows) {
  const head = ["ID", "Citizen", "Category", "Sub-county", "Location", "Status", "Created"];
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const body = rows.map((r) => [r.id, r.userName, r.category, r.subCounty, r.location, r.status, r.createdAt].map(esc).join(","));
  const url = URL.createObjectURL(new Blob([[head.join(","), ...body].join("\n")], { type: "text/csv" }));
  Object.assign(document.createElement("a"), { href: url, download: "requests.csv" }).click();
  URL.revokeObjectURL(url);
}

// Admin view: analytics, the queue, every complaint with filters, and staff accounts.
export default function AdminDashboard({ requests, onStatus, onFeedback }) {
  const { t } = useLang();
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [q, setQ] = useState("");

  const shown = requests.filter((r) =>
    (status === "All" || r.status === status) &&
    (category === "All" || r.category === category) &&
    (`${r.id} ${r.location} ${r.userName} ${r.description}`.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <>
      <h2>{t("a.title")}</h2>
      <Analytics requests={requests} />
      <QueueTable requests={requests} onStatus={onStatus} />
      <h3>{t("a.all2", { n: requests.length })}</h3>
      <div className="card filters">
        <input placeholder={t("a.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="All">{t("a.all")}</option>{STATUSES.map((s) => <option key={s} value={s}>{t("s." + s)}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="All">{t("a.all")}</option>{CATEGORIES.map((c) => <option key={c} value={c}>{t("cat." + c)}</option>)}
        </select>
        <button className="btn ghost" onClick={() => exportCsv(shown)} disabled={!shown.length}>{t("a.export")}</button>
      </div>
      {shown.length === 0 && <p className="muted center">{t("a.nomatch")}</p>}
      <div className="grid">{shown.map((r) => <RequestCard key={r.id} req={r} admin position={r.position} onStatus={onStatus} onFeedback={onFeedback} />)}</div>
      <StaffManager />
    </>
  );
}
