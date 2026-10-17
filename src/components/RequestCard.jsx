import { useState } from "react";
import { STATUSES } from "../config.js";
import { useLang } from "../i18n.jsx";

const cls = (s) => "status " + s.toLowerCase().replace(" ", "-");

// Admin-only box for writing feedback to the resident who made the request.
function FeedbackForm({ onSend }) {
  const { t } = useLang();
  const [text, setText] = useState("");
  function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }
  return (
    <form className="fb-form" onSubmit={send}>
      <label>{t("k.fbLabel")}
        <textarea rows="2" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("k.fbPh")} />
      </label>
      <button className="btn small" type="submit" disabled={!text.trim()}>{t("k.send")}</button>
    </form>
  );
}

// One request with its progress tracker, history and feedback. Admins also get status buttons.
export default function RequestCard({ req, admin, position, onStatus, onFeedback }) {
  const { t, fmtDate } = useLang();
  const step = STATUSES.indexOf(req.status);
  const feedback = req.feedback || [];

  // History notes are saved in English; show them in the chosen language.
  const note = (n) => (n === "Request submitted" ? t("h.submitted") : n.startsWith("Marked ") ? t("h.marked", { status: t("s." + n.slice(7)) }) : n);

  return (
    <article className="card req">
      <div className="req-top">
        <strong>{req.id}</strong>
        <span>{position && <span className="qbadge">{t("q.badge", { n: position })}</span>} <span className={cls(req.status)}>{t("s." + req.status)}</span></span>
      </div>
      <h4>{t("cat." + req.category)} <small>· {req.subCounty}</small></h4>
      <p className="muted">{t("k.loc")}: {req.location}{admin && ` · ${t("k.by")} ${req.userName}`}</p>
      <p>{req.description}</p>
      {req.image && <img className="preview" src={req.image} alt={t("r.attached")} />}

      <ol className="tracker">
        {STATUSES.map((s, i) => <li key={s} className={i <= step ? "done" : ""}>{t("s." + s)}</li>)}
      </ol>

      {feedback.length > 0 && (
        <div className="feedback">
          <b>{t("k.feedback")}</b>
          {feedback.map((f) => (
            <p key={f.id}>
              {!f.read && !admin && <span className="new">{t("k.new")}</span>} {f.message}
              <small>{f.by} · {fmtDate(f.at)}</small>
            </p>
          ))}
        </div>
      )}

      <details>
        <summary>{t("k.history")}</summary>
        <ul className="history">
          {req.history.map((h, i) => <li key={i}>{fmtDate(h.at)} — <b>{t("s." + h.status)}</b>: {note(h.note)}</li>)}
        </ul>
      </details>

      {admin && (
        <>
          {req.status !== "Resolved" && (
            <div className="actions">
              {STATUSES.filter((s) => STATUSES.indexOf(s) > step).map((s) => (
                <button key={s} className="btn small" onClick={() => onStatus(req.id, s)}>{t("k.mark", { status: t("s." + s) })}</button>
              ))}
            </div>
          )}
          <FeedbackForm onSend={(msg) => onFeedback(req.id, msg)} />
        </>
      )}
    </article>
  );
}
