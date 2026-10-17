import RequestForm from "./RequestForm.jsx";
import RequestCard from "./RequestCard.jsx";
import QueueBanner from "./QueueBanner.jsx";
import { useLang } from "../i18n.jsx";

// Resident view: queue position, submit a request, and see only their own requests.
export default function CitizenDashboard({ user, requests, queueTotal, onCreate, onReadFeedback }) {
  const { t } = useLang();
  const unread = requests.reduce((n, r) => n + (r.feedback || []).filter((f) => !f.read).length, 0);
  return (
    <>
      <h2>{t("c.welcome", { name: user.name.split(" ")[0] })}</h2>
      {unread > 0 && (
        <div className="alert">
          <span>{t("c.alert", { n: unread })}</span>
          <button className="btn small" onClick={onReadFeedback}>{t("c.markRead")}</button>
        </div>
      )}
      <QueueBanner requests={requests} total={queueTotal} />
      <div className="two-col">
        <RequestForm onSubmit={onCreate} />
        <div>
          <h3>{t("c.mine", { n: requests.length })}</h3>
          {requests.length === 0 && <p className="muted">{t("c.none")}</p>}
          {requests.map((r) => <RequestCard key={r.id} req={r} position={r.position} />)}
        </div>
      </div>
    </>
  );
}
