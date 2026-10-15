import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

// index.html carries default <title>/<meta> tags for crawlers that don't run JavaScript.
// Pages render their own (React hoists them into <head>), so drop the defaults to avoid duplicates.
document.head.querySelectorAll("title, meta[name='description'], meta[property^='og:'], meta[name^='twitter:']").forEach((el) => el.remove());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
