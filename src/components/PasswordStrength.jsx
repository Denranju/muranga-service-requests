import { RULES, passedRules } from "../password.js";
import { useLang } from "../i18n.jsx";

// Strength bar plus a checklist of the rules the password still has to meet.
export default function PasswordStrength({ value }) {
  const { t } = useLang();
  const n = value ? passedRules(value) : 0;
  return (
    <div className="strength" aria-live="polite">
      <div className="meter"><div className={`meter-fill lvl-${n}`} style={{ width: `${(n / RULES.length) * 100}%` }} /></div>
      <p className="muted">{t("str.label")}: <b>{value ? t("str." + n) : t("str.enter")}</b></p>
      <ul className="rules">
        {RULES.map((r) => <li key={r.key} className={r.test(value) ? "ok" : ""}>{t(r.key)}</li>)}
      </ul>
    </div>
  );
}
