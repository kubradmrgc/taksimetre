import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { AppRouter } from "./AppRouter.jsx";
import "./index.css";

/**
 * Service Worker kaydı.
 * registerType: autoUpdate → yeni sürüm arka planda iner, sonraki açılışta uygulanır.
 */
registerSW({ immediate: true });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);
