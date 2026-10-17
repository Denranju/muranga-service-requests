import { useState } from "react";
import { useLang } from "../i18n.jsx";

// Password input. What is typed is visible by default; Hide masks it.
export default function PasswordField({ label, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(true);
  const { t } = useLang();
  return (
    <label>
      {label}
      <span className="pw">
        <input required type={visible ? "text" : "password"} value={value} onChange={onChange} autoComplete={autoComplete} />
        <button type="button" className="pw-toggle" onClick={() => setVisible(!visible)} aria-pressed={visible}>
          {visible ? t("pw.hide") : t("pw.show")}
        </button>
      </span>
    </label>
  );
}
