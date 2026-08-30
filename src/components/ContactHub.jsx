import { useEffect, useMemo, useRef, useState } from "react";
import { ContactCard } from "./ContactCard.jsx";
import { TaxiStandCard } from "./TaxiStandCard.jsx";
import { FEATURED_CITY_IDS, PROVINCES } from "../lib/provinces.js";
import {
  fetchStandsForCity,
  getChamberContacts,
  loadContactContext,
} from "../lib/taxiServices.js";

const TABS = [
  { id: "complaint", label: "Acil Durum / Şikayet" },
  { id: "call", label: "Taksi Çağır" },
];

/**
 * Şikayet hatları (yerel JSON) + yakındaki taksi durakları (Overpass / Google).
 */
export function ContactHub({ preferredCityId }) {
  const [tab, setTab] = useState("complaint");
  const [loading, setLoading] = useState(false);
  const [standsLoading, setStandsLoading] = useState(false);
  const [context, setContext] = useState(null);
  const [error, setError] = useState(null);
  const [standCityId, setStandCityId] = useState(preferredCityId || "istanbul");
  const [cityManual, setCityManual] = useState(false);
  const abortRef = useRef(null);
  const standsAbortRef = useRef(null);

  useEffect(() => {
    if (!cityManual && preferredCityId) {
      setStandCityId(preferredCityId);
    }
  }, [preferredCityId, cityManual]);

  async function refresh() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await loadContactContext({
        preferredCityId,
        standCityId: cityManual ? standCityId : null,
        signal: controller.signal,
      });
      setContext(result);
      if (!cityManual && result.standCityId) {
        setStandCityId(result.standCityId);
      }
      if (result.error) setError(result.error);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "İletişim verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  async function loadStandsForSelectedCity(nextCityId) {
    standsAbortRef.current?.abort();
    const controller = new AbortController();
    standsAbortRef.current = controller;

    setStandsLoading(true);
    setError(null);

    try {
      const result = await fetchStandsForCity(nextCityId, {
        signal: controller.signal,
      });
      setContext((current) => ({
        ...(current ?? {}),
        position: result.position,
        standCityId: result.cityId,
        stands: result.stands,
        standsProvider: result.provider,
        chambers:
          current?.chambers ??
          getChamberContacts(preferredCityId || nextCityId),
      }));
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Duraklar yüklenemedi.");
      setContext((current) =>
        current
          ? { ...current, stands: [], standCityId: nextCityId }
          : current,
      );
    } finally {
      setStandsLoading(false);
    }
  }

  function handleStandCityChange(nextCityId) {
    setCityManual(true);
    setStandCityId(nextCityId);
    loadStandsForSelectedCity(nextCityId);
  }

  useEffect(() => {
    refresh();
    return () => {
      abortRef.current?.abort();
      standsAbortRef.current?.abort();
    };
    // preferredCityId değişince ilk yükleme / şikayet güncellenir
  }, [preferredCityId]);

  const chambers = context?.chambers;
  const selectedProvince = useMemo(
    () => PROVINCES.find((city) => city.id === standCityId),
    [standCityId],
  );
  const cityLabel =
    selectedProvince?.name ||
    context?.detectedCity?.cityName ||
    chambers?.cityName ||
    "Seçili şehir";

  const featuredCities = FEATURED_CITY_IDS.map((id) =>
    PROVINCES.find((city) => city.id === id),
  ).filter(Boolean);

  return (
    <section
      aria-labelledby="contact-hub-title"
      className="rounded-3xl border border-stone-300/70 bg-card p-5 shadow-sm sm:p-6 dark:border-white/10 dark:bg-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="contact-hub-title" className="text-lg font-semibold tracking-tight">
            İletişim ve şikayet
          </h2>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {cityLabel}
            {context?.standsProvider
              ? ` · durak kaynağı: ${context.standsProvider}`
              : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCityManual(false);
            refresh();
          }}
          disabled={loading}
          className="rounded-xl border border-stone-300/80 px-3 py-2 text-sm font-medium transition hover:border-taxi disabled:opacity-50 dark:border-white/10 dark:hover:border-taxi/50"
        >
          {loading ? "Yükleniyor…" : "Konumu yenile"}
        </button>
      </div>

      <div
        role="tablist"
        aria-label="İletişim sekmeleri"
        className="mt-4 grid grid-cols-2 gap-2"
      >
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                active
                  ? item.id === "complaint"
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-taxi bg-taxi text-ink"
                  : "border-stone-300/80 bg-white hover:border-taxi/70 dark:border-white/10 dark:bg-white/5"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-amber-400/40 bg-amber-400/15 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
          {error}
        </p>
      ) : null}

      {tab === "complaint" ? (
        <div role="tabpanel" className="mt-4 space-y-3">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {chambers?.disclaimer}
          </p>
          {(chambers?.all ?? []).map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
          {!chambers?.contacts?.length ? (
            <p className="text-sm text-stone-500">
              Bu şehir için kayıtlı oda kaydı yok; ulusal hatlar listeleniyor.
              Şehir seçimini kontrol edin veya konumu yenileyin.
            </p>
          ) : null}
        </div>
      ) : (
        <div role="tabpanel" className="mt-4 space-y-3">
          <div>
            <p className="text-sm font-medium">Şehir seç</p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Duraklar seçilen il merkezine göre aranır. Konumu yenile ile GPS
              şehrine dönebilirsiniz.
            </p>

            <div className="mt-2 grid grid-cols-3 gap-2">
              {featuredCities.map((city) => {
                const active = standCityId === city.id;
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleStandCityChange(city.id)}
                    className={`rounded-2xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                      active
                        ? "border-taxi bg-taxi text-ink"
                        : "border-stone-300/80 bg-white hover:border-taxi/70 dark:border-white/10 dark:bg-white/5"
                    }`}
                  >
                    {city.shortName}
                    <span className="mt-0.5 block text-xs font-medium opacity-70">
                      {city.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <label htmlFor="stand-city" className="mt-3 block text-sm font-medium">
              Tüm iller
            </label>
            <select
              id="stand-city"
              value={standCityId}
              onChange={(event) => handleStandCityChange(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-stone-300/80 bg-white px-3.5 py-2.5 text-base text-ink shadow-sm outline-none transition focus:border-taxi focus:ring-2 focus:ring-taxi/30 dark:border-white/10 dark:bg-white/5 dark:text-stone-100"
            >
              {PROVINCES.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.plate} · {city.name}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400">
            Duraklar mesafeye göre sıralanır. Kaynak sırası: Google Places →
            Foursquare → Geoapify → OSM. Telefonu olanlarda Ara arama ekranını
            açar.
          </p>

          {context?.needsApiKey && (context?.stands?.length ?? 0) > 0 ? (
            <p className="rounded-xl border border-stone-300/70 px-3 py-2 text-xs text-stone-500 dark:border-white/10 dark:text-stone-400">
              Sonuçlar OSM üzerinden geldi. Daha güncel ve telefonlu kayıtlar
              için <code className="font-mono">.env</code> içine Google Places
              anahtarı ekleyebilirsiniz.
            </p>
          ) : null}

          {standsLoading || (loading && !context?.stands?.length) ? (
            <p className="text-sm text-stone-500">Duraklar aranıyor…</p>
          ) : null}

          {(context?.stands ?? []).map((stand) => (
            <TaxiStandCard key={stand.id} stand={stand} />
          ))}

          {!standsLoading &&
          !loading &&
          context &&
          context.stands.length === 0 ? (
            <div className="space-y-2 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
              <p>
                Bu bölgede ücretsiz OSM kaydı bulunamadı. Daha güvenilir sonuç
                için Google Places / Foursquare / Geoapify anahtarı ekleyin.
              </p>
              <p className="text-xs opacity-90">
                Proje kökünde <code className="font-mono">.env</code> dosyasına{" "}
                <code className="font-mono">VITE_GOOGLE_PLACES_API_KEY</code>{" "}
                yazıp <code className="font-mono">npm run dev</code> yeniden
                başlatın. Ayrıntılar: <code className="font-mono">.env.example</code>
              </p>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
