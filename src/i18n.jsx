import { createContext, useCallback, useContext, useState } from "react";
import { COUNTY } from "./config.js";
import dict from "./translations.js";

const Ctx = createContext(null);
const STORAGE_KEY = "mcsr_lang";
const DATE_LOCALES = { en: "en-KE", sw: "sw-KE", ki: "en-KE" };

export const LANGS = [
  { code: "en", label: "English" },
  { code: "sw", label: "Kiswahili" },
  { code: "ki", label: "Gĩkũyũ" },
];

// Holds the chosen language (remembered between visits) and the t() translate function.
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || "en"; } catch { return "en"; }
  });

  const choose = (code) => {
    setLang(code);
    try { localStorage.setItem(STORAGE_KEY, code); } catch { /* storage unavailable */ }
  };

  // t("key", { name: "Amina" }) replaces {name} in the text; falls back to English.
  const t = useCallback((key, vars = {}) => {
    const text = dict[lang]?.[key] ?? dict.en[key] ?? key;
    const all = { county: COUNTY.name, ...vars };
    return text.replace(/\{(\w+)\}/g, (_, k) => all[k] ?? "");
  }, [lang]);

  const fmtDate = (d) => new Date(d).toLocaleString(DATE_LOCALES[lang], { dateStyle: "medium", timeStyle: "short" });

  return <Ctx.Provider value={{ lang, choose, t, fmtDate }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);

// Three buttons: English, Kiswahili, Gĩkũyũ.
export function LangSwitcher() {
  const { lang, choose, t } = useLang();
  return (
    <div className="langs" role="group" aria-label={t("lang.label")}>
      {LANGS.map((l) => (
        <button key={l.code} type="button" aria-pressed={lang === l.code} className={lang === l.code ? "on" : ""} onClick={() => choose(l.code)}>
          {l.label}
        </button>
      ))}
    </div>
  );
}
