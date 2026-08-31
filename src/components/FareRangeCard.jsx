import { formatLira } from "../lib/formatCurrency.js";

export function FareRangeCard({ range, fareTotal = null, sourceLabel }) {
  if (!range || !Number.isFinite(range.minFare) || !Number.isFinite(range.maxFare)) {
    return null;
  }

  const { minFare, avgFare, maxFare } = range;
  const span = Math.max(maxFare - minFare, 0.01);
  const marker =
    fareTotal != null && Number.isFinite(fareTotal)
      ? Math.min(1, Math.max(0, (fareTotal - minFare) / span))
      : null;

  return (
    <section
      aria-label="Beklenen ücret aralığı"
      className="rounded-2xl border border-stone-300/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Ücret aralığı</h3>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {sourceLabel ??
              "Beklenen min–max bandı. Aralık dışı tutarlar sorunlu olabilir."}
          </p>
        </div>
        <p className="font-mono text-sm font-semibold tabular-nums text-ink dark:text-stone-100">
          {formatLira(minFare)} – {formatLira(maxFare)}
        </p>
      </div>

      <div className="relative mt-4 h-2.5 rounded-full bg-stone-200 dark:bg-white/10">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-taxi/70"
          style={{ width: "100%" }}
        />
        {marker != null ? (
          <span
            title={formatLira(fareTotal)}
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-taxi shadow dark:border-stone-100"
            style={{ left: `${marker * 100}%` }}
          />
        ) : null}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <PriceCell label="Min" value={minFare} />
        <PriceCell label="Ortalama" value={avgFare} emphasize />
        <PriceCell label="Max" value={maxFare} />
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
