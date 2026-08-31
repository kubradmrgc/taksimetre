import { formatDuration } from "../lib/geo.js";


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

  const pointCount = Array.isArray(estimate.polyline)
    ? estimate.polyline.length
    : 0;

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
          {pointCount > 0 ? (
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Haritada {pointCount.toLocaleString("tr-TR")} noktalı sürüş
              çizgisi gösteriliyor.
            </p>
          ) : null}
        </div>
        <div className="text-right text-xs text-stone-500 dark:text-stone-400">
          <p className="font-mono text-sm font-semibold tabular-nums text-ink dark:text-stone-100">
            {estimate.distanceKm.toFixed(1)} km
          </p>
          <p>{formatDuration(estimate.durationSeconds)}</p>
        </div>
      </div>
    </section>
  );
}
