import { CITY_TARIFFS } from "../lib/tariffs.js";

export function CityPresets({ selectedId, onSelect }) {
  return (
    <section aria-labelledby="city-presets-title">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 id="city-presets-title" className="text-sm font-semibold">
          Şehir tarifesi
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          2026 güncel sarı taksi
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {CITY_TARIFFS.map((city) => {
          const isActive = selectedId === city.id;

          return (
            <button
              key={city.id}
              type="button"
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
        })}
      </div>
    </section>
  );
}
