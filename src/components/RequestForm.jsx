import { useState } from "react";
import { CATEGORIES, SUB_COUNTIES } from "../config.js";
import { useLang } from "../i18n.jsx";

const MAX_IMG = 500 * 1024;

// Form residents use to report a problem. Photo is optional and limited to 500KB.
export default function RequestForm({ onSubmit }) {
  const { t } = useLang();
  const empty = { category: CATEGORIES[0], subCounty: SUB_COUNTIES[0], location: "", description: "", image: "" };
  const [f, setF] = useState(empty);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function pickImage(e) {
    const file = e.target.files[0];
    if (!file) return setF({ ...f, image: "" });
    if (!file.type.startsWith("image/")) return setError(t("err.img"));
    if (file.size > MAX_IMG) { e.target.value = ""; return setError(t("err.imgSize")); }
    setError("");
    const reader = new FileReader();
    reader.onload = () => setF((p) => ({ ...p, image: reader.result }));
    reader.readAsDataURL(file);
  }

  function submit(e) {
    e.preventDefault();
    if (f.description.trim().length < 10) return setError(t("err.desc"));
    onSubmit(f);
    setF(empty);
    e.target.reset();
  }

  return (
    <form className="card" onSubmit={submit}>
      <h3>{t("r.new")}</h3>
      <div className="row">
        <label>{t("r.category")}<select value={f.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c} value={c}>{t("cat." + c)}</option>)}</select></label>
        <label>{t("r.subCounty")}<select value={f.subCounty} onChange={set("subCounty")}>{SUB_COUNTIES.map((c) => <option key={c}>{c}</option>)}</select></label>
      </div>
      <label>{t("r.location")}<input required value={f.location} onChange={set("location")} placeholder={t("r.locPh")} /></label>
      <label>{t("r.desc")}<textarea required rows="4" value={f.description} onChange={set("description")} /></label>
      <label>{t("r.photo")}<input type="file" accept="image/*" onChange={pickImage} /></label>
      {f.image && <img className="preview" src={f.image} alt={t("r.preview")} />}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" type="submit">{t("r.submit")}</button>
    </form>
  );
}
