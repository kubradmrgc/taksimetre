import { formatDuration } from "../lib/geo.js";
import { formatLira } from "../lib/formatCurrency.js";

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

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <PriceCell label="Min" value={estimate.minFare} />
        <PriceCell label="Ortalama" value={estimate.avgFare} emphasize />
        <PriceCell label="Max" value={estimate.maxFare} />
      </dl>
    </section>
  );
}

function PriceCell({ label, value, emphasize = false }) {
  return (
    <div
      className={`rounded-xl px-2 py-2.5 ${
        emphasize
          ? "bg-taxi/25 text-ink dark:bg-taxi/20 dark:text-taxi"
          : "bg-stone-100 text-ink dark:bg-black/30 dark:text-stone-200"
      }`}
    >
      <dt className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-sm font-semibold tabular-nums">
        {formatLira(value)}
      </dd>
    </div>
  );
}
