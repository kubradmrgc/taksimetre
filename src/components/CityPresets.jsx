import { useMemo, useState } from "react";
import { FEATURED_CITY_IDS } from "../lib/provinces.js";
import { CITY_TARIFFS, TARIFF_META } from "../lib/tariffs.js";

function foldTr(value) {
  return String(value ?? "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

function CityButton({ city, isActive, onSelect }) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={() => onSelect(city.id)}
      className={`rounded-2xl border px-3 py-3 text-left transition ${
        isActive
          ? "border-taxi bg-taxi text-ink shadow-sm"
          : "border-stone-300/80 bg-white hover:border-taxi/70 dark:border-white/10 dark:bg-white/5 dark:hover:border-taxi/50"
      }`}
    >
      <span className="block text-[11px] font-semibold tracking-wider opacity-70">
        {city.shortName}
      </span>
      <span className="mt-0.5 block text-sm font-semibold">{city.name}</span>
    </button>
  );
}

export function CityPresets({ selectedId, onSelect }) {
  const [query, setQuery] = useState("");

  const featured = useMemo(
    () =>
      FEATURED_CITY_IDS.map((id) => CITY_TARIFFS.find((city) => city.id === id)).filter(
        Boolean,
      ),
    [],
  );

  const filtered = useMemo(() => {
    const needle = foldTr(query.trim());
    const featuredIds = new Set(FEATURED_CITY_IDS);

    const list = CITY_TARIFFS.filter((city) => {
      if (!needle && featuredIds.has(city.id)) return false;
      if (!needle) return true;
      return (
        foldTr(city.name).includes(needle) ||
        foldTr(city.shortName).includes(needle) ||
        city.plate.includes(needle) ||
        city.id.includes(needle)
      );
    });

    return list.sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [query]);

  return (
    <section aria-labelledby="city-presets-title">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 id="city-presets-title" className="text-sm font-semibold">
          Şehir tarifesi
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {TARIFF_META.cityCount} il · 2026
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {featured.map((city) => (
          <CityButton
            key={city.id}
            city={city}
            isActive={selectedId === city.id}
            onSelect={onSelect}
          />
        ))}
      </div>

      <label htmlFor="city-search" className="mt-4 block text-sm font-medium">
        İl ara
      </label>
      <input
        id="city-search"
        type="search"
        autoComplete="off"
        placeholder="Örn. Bursa, 16, BRS"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mt-1.5 w-full rounded-xl border border-stone-300/80 bg-white px-3.5 py-2.5 text-base text-ink shadow-sm outline-none transition placeholder:text-stone-400 focus:border-taxi focus:ring-2 focus:ring-taxi/30 dark:border-white/10 dark:bg-white/5 dark:text-stone-100"
      />

      <div
        role="listbox"
        aria-label="İl tarifeleri"
        className="mt-2 grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pr-0.5"
      >
        {filtered.map((city) => (
          <CityButton
            key={city.id}
            city={city}
            isActive={selectedId === city.id}
            onSelect={onSelect}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
          Eşleşen il yok. Yazımı kontrol edin veya aramayı temizleyin.
        </p>
      ) : null}
    </section>
  );
}
