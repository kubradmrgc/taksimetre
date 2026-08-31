import { hubsForCity, hubToPlace } from "../lib/travelHubs.js";

/**
 * Seçili ile göre havalimanı / otogar kısayolları.
 */
export function TravelHubShortcuts({
  cityId,
  selectedId = null,
  onSelect,
  disabled = false,
}) {
  const hubs = hubsForCity(cityId);
  if (hubs.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-medium text-ink dark:text-stone-200">
        Hızlı varış
      </p>
      <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
        Havalimanı veya otogar seçerek rotayı doldurun.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {hubs.map((hub) => {
          const place = hubToPlace(hub);
          const active = selectedId === place.id;
          return (
            <button
              key={hub.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect?.(place)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                active
                  ? "border-taxi bg-taxi text-ink"
                  : "border-stone-300/80 bg-white text-ink hover:border-taxi/70 dark:border-white/10 dark:bg-white/5 dark:text-stone-100"
              }`}
            >
              {hub.kind === "airport" ? "Havalimanı · " : "Otogar · "}
              {hub.shortName}
            </button>
          );
        })}
      </div>
    </div>
  );
}
