import { formatDuration } from "../lib/geo.js";

/** Varış rotası özeti (km / süre). Ücret aralığı FareRangeCard'ta gösterilir. */
export function RouteEstimate({ estimate, loading, error, destinationLabel }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-stone-300/70 bg-white/60 px-4 py-3 text-sm text-stone-600 dark:border-white/10 dark:bg-white/5 dark:text-stone-300">
        Rota ve fiyat aralığı hesaplanıyor…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
        {error}
      </div>
    );
  }

  if (!estimate) return null;

  return (
    <section className="rounded-2xl border border-stone-300/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Tahmini rota</h3>
          {destinationLabel ? (
            <p className="mt-1 line-clamp-2 text-xs text-stone-500 dark:text-stone-400">
              {destinationLabel}
            </p>
          ) : null}
        </div>
        <div className="text-right text-xs text-stone-500 dark:text-stone-400">
          <p>{estimate.distanceKm.toFixed(1)} km</p>
          <p>{formatDuration(estimate.durationSeconds)}</p>
        </div>
      </div>
    </section>
  );
}
