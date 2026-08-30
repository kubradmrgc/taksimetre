import { useAnimatedNumber } from "../hooks/useAnimatedNumber.js";
import { formatDecimal, formatLira } from "../lib/formatCurrency.js";

export function FareResult({ fare, cityLabel, compact = false }) {
  const animatedTotal = useAnimatedNumber(fare.total);

  return (
    <section
      aria-live="polite"
      className="overflow-hidden rounded-3xl border border-white/10 bg-[#12141a] text-stone-100 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.65)]"
    >
      {!compact ? (
        <>
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-taxi">
            <span>Taksimetre</span>
            <span className="truncate pl-3 text-stone-400">{cityLabel}</span>
          </div>

          <div className="px-5 py-6">
            <p className="text-xs font-medium uppercase tracking-widest text-stone-400">
              {fare.appliedMinimum
                ? "İndi-bindi uygulandı"
                : fare.roundTrip
                  ? "Gidiş-dönüş tahmini"
                  : "Hesaplanan tutar"}
            </p>
            <p className="mt-2 font-mono text-4xl font-semibold tabular-nums tracking-tight text-taxi sm:text-5xl">
              {formatLira(animatedTotal)}
            </p>
          </div>
        </>
      ) : (
        <div className="border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
          Ücret kırılımı
        </div>
      )}

      <ul
        className={`divide-y divide-white/10 bg-black/25 text-sm ${
          compact ? "" : "border-t border-white/10"
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
    </section>
  );
}

function BreakdownRow({ label, amount, emphasized = false }) {
  return (
    <li
      className={`flex items-center justify-between px-5 py-2.5 ${
        emphasized ? "font-medium text-stone-100" : "text-stone-300"
      }`}
    >
      <span>{label}</span>
      <span className="font-mono tabular-nums">{formatDecimal(amount)} ₺</span>
    </li>
  );
}
