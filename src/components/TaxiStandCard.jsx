export function TaxiStandCard({ stand }) {
  return (
    <article className="rounded-2xl border border-stone-300/70 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-ink dark:text-stone-100">
            {stand.name}
          </h4>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            {stand.distanceLabel}
            {stand.address ? ` · ${stand.address}` : ""}
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
    </article>
  );
}
