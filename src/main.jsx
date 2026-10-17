import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { LanguageProvider } from "./i18n.jsx";
import "./styles.css";

async function start() {
  if (import.meta.env.VITE_PREVIEW) await import("./previewApi.js");
  createRoot(document.getElementById("root")).render(<LanguageProvider><App /></LanguageProvider>);
}
start();
