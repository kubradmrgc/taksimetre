import { useMemo, useState } from "react";
import { CityPresets } from "./components/CityPresets.jsx";
import { FareForm } from "./components/FareForm.jsx";
import { FareResult } from "./components/FareResult.jsx";
import { Header } from "./components/Header.jsx";
import { useTheme } from "./hooks/useTheme.js";
import { calculateFare } from "./lib/calculateFare.js";
import {
  DEFAULT_CITY_ID,
  getCityTariff,
  tariffToFormValues,
} from "./lib/tariffs.js";

const TRIP_FIELDS = new Set(["distanceKm", "waitingMinutes"]);

function createInitialValues() {
  return {
    distanceKm: "",
    waitingMinutes: "",
    ...tariffToFormValues(getCityTariff(DEFAULT_CITY_ID)),
  };
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [cityId, setCityId] = useState(DEFAULT_CITY_ID);
  const [values, setValues] = useState(createInitialValues);

  const selectedCity = getCityTariff(cityId);
  const cityLabel = cityId === "custom" ? "Özel tarife" : selectedCity.name;

  const fare = useMemo(
    () =>
      calculateFare({
        distanceKm: values.distanceKm,
        waitingMinutes: values.waitingMinutes,
        openingFee: values.openingFee,
        perKmFee: values.perKmFee,
        perMinuteFee: values.perMinuteFee,
        minimumFee: values.minimumFee,
      }),
    [values],
  );

  function handleFieldChange(field, value) {
    setValues((current) => ({ ...current, [field]: value }));

    if (!TRIP_FIELDS.has(field)) {
      setCityId("custom");
    }
  }

  function handleCitySelect(nextCityId) {
    const tariff = getCityTariff(nextCityId);
    setCityId(nextCityId);
    setValues((current) => ({
      ...current,
      ...tariffToFormValues(tariff),
    }));
  }

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,196,0,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(20,21,26,0.08),transparent_40%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(245,196,0,0.12),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_42%)]"
      />

      <main className="relative mx-auto flex min-h-dvh max-w-5xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:py-14">
        <Header theme={theme} onToggleTheme={toggleTheme} />

        <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="order-2 space-y-6 rounded-3xl border border-stone-300/70 bg-card p-5 shadow-sm sm:p-6 dark:border-white/10 dark:bg-panel lg:order-1">
            <CityPresets selectedId={cityId} onSelect={handleCitySelect} />
            <FareForm values={values} onChange={handleFieldChange} />
            <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
              {cityId === "custom"
                ? "Özel tarife kullanılıyor. Şehir butonlarından güncel tarifeye dönebilirsiniz."
                : `${selectedCity.note}. Resmi tarife değişebilir; değerleri dilediğiniz gibi düzenleyebilirsiniz.`}
            </p>
          </div>

          <div className="order-1 lg:sticky lg:top-8 lg:order-2">
            <FareResult fare={fare} cityLabel={cityLabel} />
          </div>
        </div>
      </main>
    </div>
  );
}
