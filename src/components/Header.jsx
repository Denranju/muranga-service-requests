import Logo from "./Logo.jsx";
import { COUNTY } from "../config.js";
import { LangSwitcher, useLang } from "../i18n.jsx";

export default function Header({ user, onLogout }) {
  const { t } = useLang();
  return (
    <>
      <div className="helpbar">
        <span>{t("helpline")}: <a href={`tel:${COUNTY.helpline.replace(/\s/g, "")}`}>{COUNTY.helpline}</a></span>
        <span>{t("emailLabel")}: {COUNTY.email}</span>
        <LangSwitcher />
      </div>
      <header className="header">
        <div className="brand">
          <Logo />
          <div>
            <h1>{COUNTY.name}</h1>
            <p>{t("system")}</p>
          </div>
        </div>
        {user && (
          <div className="userbox">
            <span>{user.name}{user.staffNo && ` (${user.staffNo})`} <em className="badge">{t("role." + user.role)}</em></span>
            <button className="btn ghost" onClick={onLogout}>{t("logout")}</button>
          </div>
        )}
      </header>
    </>
  );
}
