import { useEffect, useMemo, useRef, useState } from "react";
import { CityPresets } from "./components/CityPresets.jsx";
import { ContactHub } from "./components/ContactHub.jsx";
import { DestinationSearch } from "./components/DestinationSearch.jsx";
import { DeviationAlert } from "./components/DeviationAlert.jsx";
import { FareForm } from "./components/FareForm.jsx";
import { FareRangeCard } from "./components/FareRangeCard.jsx";
import { FareResult } from "./components/FareResult.jsx";
import { Header } from "./components/Header.jsx";
import { RouteEstimate } from "./components/RouteEstimate.jsx";
import { TripControls } from "./components/TripControls.jsx";
import { TripHud } from "./components/TripHud.jsx";
import { useTheme } from "./hooks/useTheme.js";
import { useTrip } from "./hooks/useTrip.js";
import { calculateFare } from "./lib/calculateFare.js";
import {
  buildFareRange,
  evaluateFareAgainstRange,
  mergeAlerts,
} from "./lib/fareRange.js";
import {
  estimateFareRange,
  fetchDrivingRoute,
  getCurrentPositionOnce,
  getFallbackOrigin,
} from "./lib/routing.js";
import {
  DEFAULT_CITY_ID,
  formatFetchedAt,
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

function formatTripField(value, digits = 2) {
  if (!Number.isFinite(value) || value <= 0) return "0";
  return value.toFixed(digits);
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [cityId, setCityId] = useState(DEFAULT_CITY_ID);
  const [values, setValues] = useState(createInitialValues);
  const [destination, setDestination] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState(null);
  const estimateAbortRef = useRef(null);

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

  /** Varış rotası varsa o; yoksa forma girilen mesafe üzerinden aralık. */
  const fareRange = useMemo(() => {
    if (estimate?.minFare != null && estimate?.maxFare != null) {
      return {
        minFare: estimate.minFare,
        avgFare: estimate.avgFare,
        maxFare: estimate.maxFare,
        distanceKm: estimate.distanceKm,
        durationSeconds: estimate.durationSeconds,
      };
    }

    const distance = Number(String(values.distanceKm).replace(",", "."));
    if (!Number.isFinite(distance) || distance <= 0) return null;

    return buildFareRange({
      distanceKm: values.distanceKm,
      waitingMinutes: values.waitingMinutes,
      openingFee: values.openingFee,
      perKmFee: values.perKmFee,
      perMinuteFee: values.perMinuteFee,
      minimumFee: values.minimumFee,
    });
  }, [estimate, values]);

  const trip = useTrip({
    estimate,
    fareRange,
    fareTotal: fare.total,
  });

  const rangeAlerts = useMemo(() => {
    const fareAlert = evaluateFareAgainstRange(fare.total, fareRange, {
      checkBelow: !trip.isLive,
    });
    if (trip.isLive || trip.status === "ended") {
      return mergeAlerts(fareAlert, trip.alerts);
    }
    return fareAlert;
  }, [fare.total, fareRange, trip.alerts, trip.isLive, trip.status]);

  const tripLocked =
    trip.status === "locating" ||
    trip.status === "active" ||
    trip.status === "ended";

  // GPS'ten gelen mesafe / beklemeyi forma yaz
  useEffect(() => {
    if (!trip.isLive && trip.status !== "ended") return;

    setValues((current) => ({
      ...current,
      distanceKm: formatTripField(trip.distanceKm, 3),
      waitingMinutes: formatTripField(trip.waitingMinutes, 2),
    }));
  }, [
    trip.isLive,
    trip.status,
    trip.distanceKm,
    trip.waitingMinutes,
  ]);

  // Tarife değişince tahmini fiyat aralığını güncelle
  useEffect(() => {
    if (!estimate || !destination) return;

    const tariff = {
      openingFee: values.openingFee,
      perKmFee: values.perKmFee,
      perMinuteFee: values.perMinuteFee,
      minimumFee: values.minimumFee,
    };

    const range = estimateFareRange(
      {
        distanceKm: estimate.distanceKm,
        durationSeconds: estimate.durationSeconds,
      },
      tariff,
    );

    setEstimate((current) =>
      current
        ? {
            ...current,
            minFare: range.minFare,
            avgFare: range.avgFare,
            maxFare: range.maxFare,
          }
        : current,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca tarife alanları
  }, [
    values.openingFee,
    values.perKmFee,
    values.perMinuteFee,
    values.minimumFee,
  ]);

  async function buildEstimate(place) {
    estimateAbortRef.current?.abort();
    const controller = new AbortController();
    estimateAbortRef.current = controller;

    setEstimateLoading(true);
    setEstimateError(null);

    try {
      const origin =
        (await getCurrentPositionOnce()) ?? getFallbackOrigin(cityId);
      const route = await fetchDrivingRoute(origin, place, {
        signal: controller.signal,
      });
      const range = estimateFareRange(route, {
        openingFee: values.openingFee,
        perKmFee: values.perKmFee,
        perMinuteFee: values.perMinuteFee,
        minimumFee: values.minimumFee,
      });

      setEstimate({
        ...route,
        ...range,
        destinationLabel: place.label,
      });
    } catch (err) {
      if (err.name === "AbortError") return;
      setEstimate(null);
      setEstimateError(err.message || "Tahmini rota alınamadı.");
    } finally {
      setEstimateLoading(false);
    }
  }

  function handleFieldChange(field, value) {
    if (tripLocked && TRIP_FIELDS.has(field)) return;

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
      ...(tripLocked
        ? {
            distanceKm: current.distanceKm,
            waitingMinutes: current.waitingMinutes,
          }
        : {}),
    }));
  }

  function handleDestinationSelect(place) {
    setDestination(place);
    buildEstimate(place);
  }

  function handleDestinationClear() {
    setDestination(null);
    setEstimate(null);
    setEstimateError(null);
    estimateAbortRef.current?.abort();
  }

  function handleStartTrip() {
    trip.startTrip();
  }

  function handleEndTrip() {
    trip.endTrip();
  }

  function handleResetTrip() {
    trip.resetTrip();
    setValues((current) => ({
      ...current,
      distanceKm: "",
      waitingMinutes: "",
    }));
  }

  const showLiveHud = trip.status !== "idle";

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

            <DestinationSearch
              selected={destination}
              onSelect={handleDestinationSelect}
              onClear={handleDestinationClear}
              disabled={trip.isLive}
            />

            <RouteEstimate
              estimate={estimate}
              loading={estimateLoading}
              error={estimateError}
              destinationLabel={destination?.label}
            />

            <FareRangeCard
              range={fareRange}
              fareTotal={fare.total}
              sourceLabel={
                estimate
                  ? "Varış rotasına göre beklenen min–max bandı."
                  : "Girilen mesafeye göre beklenen min–max bandı."
              }
            />

            <DeviationAlert alerts={rangeAlerts} />

            <TripControls
              status={trip.status}
              onStart={handleStartTrip}
              onEnd={handleEndTrip}
              onReset={handleResetTrip}
              disabled={estimateLoading}
            />

            {trip.error ? (
              <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                {trip.error}
              </p>
            ) : null}

            <FareForm
              values={values}
              onChange={handleFieldChange}
              tripLocked={tripLocked}
            />

            <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
              {cityId === "custom"
                ? "Özel tarife kullanılıyor. Şehir butonlarından güncel tarifeye dönebilirsiniz."
                : `${selectedCity.note}.`}{" "}
              Tarifeler taksicilerodasi.com ve Hemen Hesap (CC BY 4.0)
              bilgilendirme verisinden; resmi kurum değildir
              {formatFetchedAt()
                ? ` · son senkron ${formatFetchedAt()}`
                : ""}
              . Köprü / otoyol ek ücretleri dahil değildir. Değerleri
              dilediğiniz gibi düzenleyebilirsiniz. Canlı yolculuk için konum
              izni ve HTTPS (veya localhost) gerekir.
            </p>
          </div>

          <div className="order-1 space-y-4 lg:sticky lg:top-8 lg:order-2">
            {showLiveHud ? (
              <>
                <TripHud
                  fareTotal={fare.total}
                  distanceKm={trip.distanceKm}
                  elapsedSeconds={trip.elapsedSeconds}
                  waitingSeconds={trip.waitingSeconds}
                  speedKmh={trip.speedKmh}
                  status={trip.status}
                  cityLabel={cityLabel}
                  appliedMinimum={fare.appliedMinimum}
                />
                <DeviationAlert alerts={rangeAlerts} />
                <FareResult fare={fare} cityLabel={cityLabel} compact />
              </>
            ) : (
              <>
                <FareResult fare={fare} cityLabel={cityLabel} />
                <DeviationAlert alerts={rangeAlerts} />
              </>
            )}
          </div>
        </div>

        <ContactHub
          preferredCityId={cityId === "custom" ? DEFAULT_CITY_ID : cityId}
        />
      </main>
    </div>
  );
}
