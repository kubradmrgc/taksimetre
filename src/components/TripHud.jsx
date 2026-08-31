import { formatDuration } from "../lib/geo.js";
import { formatDecimal, formatLira } from "../lib/formatCurrency.js";
import { useAnimatedNumber } from "../hooks/useAnimatedNumber.js";

export function TripHud({
  fareTotal,
  distanceKm,
  elapsedSeconds,
  waitingSeconds,
  speedKmh,
  status,
  cityLabel,
  appliedMinimum,
}) {
  const animatedTotal = useAnimatedNumber(fareTotal);
  const statusLabel =
    status === "locating"
      ? "Konum alınıyor…"
      : status === "active"
        ? "Canlı yolculuk"
        : status === "ended"
          ? "Yolculuk bitti"
          : "Hazır";

  return (
    <section
      aria-live="polite"
      className="overflow-hidden rounded-3xl border border-stone-300/70 bg-card text-ink shadow-sm dark:border-white/10 dark:bg-[#12141a] dark:text-stone-100 dark:shadow-[0_20px_50px_-24px_rgba(0,0,0,0.65)]"
    >
      <div className="flex items-center justify-between border-b border-stone-200/90 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-taxi-dim dark:border-white/10 dark:text-taxi">
        <span>Taksimetre</span>
        <span className="truncate pl-3 text-stone-500 dark:text-stone-400">
          {cityLabel}
        </span>
      </div>

      <div className="px-5 py-6">
        <p className="text-xs font-medium uppercase tracking-widest text-stone-500 dark:text-stone-400">
          {appliedMinimum ? "İndi-bindi uygulandı" : "Anlık tutar"}
        </p>
        <p className="mt-2 font-mono text-4xl font-semibold tabular-nums tracking-tight text-taxi-dim dark:text-taxi sm:text-5xl">
          {formatLira(animatedTotal)}
        </p>
        <p className="mt-2 text-xs font-medium text-stone-500 dark:text-stone-400">
          {statusLabel}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-stone-200/90 bg-stone-200/80 dark:border-white/10 dark:bg-white/10 sm:grid-cols-4">
        <Stat label="Mesafe" value={`${formatDecimal(distanceKm)} km`} />
        <Stat label="Geçen süre" value={formatDuration(elapsedSeconds)} />
        <Stat label="Bekleme" value={formatDuration(waitingSeconds)} />
        <Stat label="Anlık hız" value={`${formatDecimal(speedKmh)} km/s`} />
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-card px-4 py-3 dark:bg-[#0c0d11]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm font-medium tabular-nums text-ink dark:text-stone-100">
        {value}
      </p>
    </div>
  );
}
