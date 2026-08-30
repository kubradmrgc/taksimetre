export function TaxiStandCard({ stand }) {
  return (
    <article className="rounded-2xl border border-stone-300/70 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-ink dark:text-stone-100">
            {stand.name}
          </h4>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            {[
              stand.districtName,
              stand.distanceLabel,
              stand.address,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        {stand.telHref ? (
          <a
            href={stand.telHref}
            className="shrink-0 rounded-xl bg-taxi px-3 py-2 text-sm font-semibold text-ink hover:bg-taxi/90"
          >
            Ara
          </a>
        ) : (
          <span className="shrink-0 rounded-xl border border-stone-300/80 px-3 py-2 text-xs text-stone-500 dark:border-white/10">
            Tel yok
          </span>
        )}
      </div>

      {stand.phone ? (
        <a
          href={stand.telHref}
          className="mt-2 inline-block font-mono text-sm text-ink underline-offset-2 hover:underline dark:text-stone-100"
        >
          {stand.phone}
        </a>
      ) : null}

      {(stand.whatsappHref || stand.website) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {stand.whatsappHref ? (
            <a
              href={stand.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-emerald-600/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-500/20 dark:text-emerald-300"
            >
              WhatsApp
            </a>
          ) : null}
          {stand.website ? (
            <a
              href={stand.website}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-stone-300/80 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-stone-100 dark:border-white/15 dark:text-stone-100 dark:hover:bg-white/10"
            >
              Web sitesi
            </a>
          ) : null}
        </div>
      )}
    </article>
  );
}
