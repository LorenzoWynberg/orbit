import "./styles/tokens.css";
import "./styles/app.css";
import { mountConverter } from "./converter.js";

if (import.meta.env.MODE === "extension") {
  document.documentElement.classList.add("extension");
}

mountConverter(document);
