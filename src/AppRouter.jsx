import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App.jsx";
import { CitiesIndexPage } from "./pages/CitiesIndexPage.jsx";
import { CityTariffPage } from "./pages/CityTariffPage.jsx";

/**
 * Tek sayfa uygulamasına URL rotaları ekler.
 * /              → hesaplayıcı
 * /sehirler      → 81 il dizini (SEO)
 * /sehir/:cityId → il tarife sayfası (SEO)
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/sehirler" element={<CitiesIndexPage />} />
        <Route path="/sehir/:cityId" element={<CityTariffPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
