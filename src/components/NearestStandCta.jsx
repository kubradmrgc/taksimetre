/**
 * Filtrelenmiş listeden telefonu olan en yakın durağı tek tuşla arar.
 */
export function NearestStandCta({ stand, onHighlight }) {
  if (!stand?.telHref) return null;

  return (
    <div className="rounded-2xl border border-taxi/50 bg-taxi/15 px-4 py-3 dark:bg-taxi/10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600 dark:text-stone-300">
        En yakın durak
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink dark:text-stone-100">
            {stand.name}
          </p>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            {[stand.distanceLabel, stand.districtName, stand.phone]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <a
            href={stand.telHref}
            onClick={() => onHighlight?.(stand)}
            className="rounded-xl bg-taxi px-4 py-2.5 text-sm font-bold text-ink hover:bg-taxi/90"
          >
            Ara
          </a>
          {stand.whatsappHref ? (
            <a
              href={stand.whatsappHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => onHighlight?.(stand)}
              className="rounded-xl border border-emerald-600/40 bg-emerald-500/10 px-3 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-500/20 dark:text-emerald-300"
            >
              WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Telefonu olan, mesafeye göre en yakın durak. */
export function pickNearestCallableStand(stands) {
  if (!Array.isArray(stands) || stands.length === 0) return null;

  const withPhone = stands.filter((stand) => stand.telHref);
  if (withPhone.length === 0) return null;

  const ranked = [...withPhone].sort((a, b) => {
    const da = Number.isFinite(a.distanceM)
      ? a.distanceM
      : Number.POSITIVE_INFINITY;
    const db = Number.isFinite(b.distanceM)
      ? b.distanceM
      : Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    // Gerçek konumlu olanlar önce
    if (a.approximate !== b.approximate) return a.approximate ? 1 : -1;
    return 0;
  });

  return ranked[0];
}
