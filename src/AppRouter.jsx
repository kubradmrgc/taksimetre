import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App.jsx";
import { PwaInstallBanner } from "./components/PwaInstallBanner.jsx";
import { CitiesIndexPage } from "./pages/CitiesIndexPage.jsx";
import { CityTariffPage } from "./pages/CityTariffPage.jsx";

/** Vite `base` (örn. /taksimetre/) → React Router basename */
const routerBasename =
  import.meta.env.BASE_URL === "/"
    ? undefined
    : String(import.meta.env.BASE_URL).replace(/\/$/, "");

/**
 * Tek sayfa uygulamasına URL rotaları ekler.
 * /              → hesaplayıcı
 * /sehirler      → 81 il dizini (SEO)
 * /sehir/:cityId → il tarife sayfası (SEO)
 */
export function AppRouter() {
  return (
    <BrowserRouter basename={routerBasename}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/sehirler" element={<CitiesIndexPage />} />
        <Route path="/sehir/:cityId" element={<CityTariffPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <PwaInstallBanner />
    </BrowserRouter>
  );
}
