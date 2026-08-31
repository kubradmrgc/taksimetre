import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { AppRouter } from "./AppRouter.jsx";
import "./index.css";

registerSW({ immediate: true });

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);
