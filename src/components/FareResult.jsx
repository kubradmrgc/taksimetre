import { useAnimatedNumber } from "../hooks/useAnimatedNumber.js";
import { formatDecimal, formatLira } from "../lib/formatCurrency.js";
import { ShareFareActions } from "./ShareFareActions.jsx";

export function FareResult({
  fare,
  cityLabel,
  compact = false,
  distanceKm,
  waitingMinutes,
  originLabel,
  destinationLabel,
}) {
  const animatedTotal = useAnimatedNumber(fare.total);

  return (
    <section
      aria-live="polite"
      className="overflow-hidden rounded-3xl border border-stone-300/70 bg-card text-ink shadow-sm dark:border-white/10 dark:bg-[#12141a] dark:text-stone-100 dark:shadow-[0_20px_50px_-24px_rgba(0,0,0,0.65)]"
    >
      {!compact ? (
        <>
          <div className="flex items-center justify-between border-b border-stone-200/90 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-taxi-dim dark:border-white/10 dark:text-taxi">
            <span>Taksimetre</span>
            <span className="truncate pl-3 text-stone-500 dark:text-stone-400">
              {cityLabel}
            </span>
          </div>

          <div className="px-5 py-6">
            <p className="text-xs font-medium uppercase tracking-widest text-stone-500 dark:text-stone-400">
              {fare.appliedMinimum
                ? "İndi-bindi uygulandı"
                : fare.roundTrip
                  ? "Gidiş-dönüş tahmini"
                  : "Hesaplanan tutar"}
            </p>
            <p className="mt-2 font-mono text-4xl font-semibold tabular-nums tracking-tight text-taxi-dim dark:text-taxi sm:text-5xl">
              {formatLira(animatedTotal)}
            </p>
          </div>
        </>
      ) : (
        <div className="border-b border-stone-200/90 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500 dark:border-white/10 dark:text-stone-400">
          Ücret kırılımı
        </div>
      )}

      <ul
        className={`divide-y divide-stone-200/90 bg-stone-100/60 text-sm dark:divide-white/10 dark:bg-black/25 ${
          compact ? "" : "border-t border-stone-200/90 dark:border-white/10"
        }`}
      >
        <BreakdownRow label="Açılış" amount={fare.openingFee} />
        <BreakdownRow label="Mesafe" amount={fare.distanceCost} />
        <BreakdownRow label="Bekleme" amount={fare.waitingCost} />
        <BreakdownRow label="Ara toplam" amount={fare.subtotal} emphasized />
        {fare.appliedMinimum ? (
          <BreakdownRow
            label="Taban (indi-bindi)"
            amount={fare.minimumFee}
            emphasized
          />
        ) : null}
        {fare.roundTrip ? (
          <BreakdownRow
            label="Gidiş-dönüş (×2)"
            amount={fare.tripTotal}
            emphasized
          />
        ) : null}
        {fare.tolls > 0 ? (
          <BreakdownRow label="Geçişler" amount={fare.tolls} />
        ) : null}
      </ul>

      <ShareFareActions
        fare={fare}
        cityLabel={cityLabel}
        distanceKm={distanceKm}
        waitingMinutes={waitingMinutes}
        originLabel={originLabel}
        destinationLabel={destinationLabel}
      />
    </section>
  );
}

function BreakdownRow({ label, amount, emphasized = false }) {
  return (
    <li
      className={`flex items-center justify-between px-5 py-2.5 ${
        emphasized
          ? "font-medium text-ink dark:text-stone-100"
          : "text-stone-600 dark:text-stone-300"
      }`}
    >
      <span>{label}</span>
      <span className="font-mono tabular-nums">{formatDecimal(amount)} ₺</span>
    </li>
  );
}
