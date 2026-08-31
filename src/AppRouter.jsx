import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App.jsx";
import { CitiesIndexPage } from "./pages/CitiesIndexPage.jsx";
import { CityTariffPage } from "./pages/CityTariffPage.jsx";

const routerBasename =
  import.meta.env.BASE_URL === "/"
    ? undefined
    : String(import.meta.env.BASE_URL).replace(/\/$/, "");

export function AppRouter() {
  return (
    <BrowserRouter basename={routerBasename}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/sehirler" element={<CitiesIndexPage />} />
        <Route path="/sehir/:cityId" element={<CityTariffPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
