import { formatFetchedAt, TARIFF_META } from "../lib/tariffs.js";

const SOURCE_LABELS = {
  taksifiyat: "taksifiyat.online",
  hemenhesap: "Hemen Hesap",
  taksicilerodasi: "taksicilerodasi.com",
  taksi724: "taksi724.com",
  custom: "Özel tarife",
};

export function TariffMetaCard({
  cityId,
  cityLabel,
  tariff,
  segmentName = null,
}) {
  const fetchedAt = formatFetchedAt();
  const sourceKey = cityId === "custom" ? "custom" : tariff?.source;
  const sourceLabel = SOURCE_LABELS[sourceKey] || sourceKey || "—";

  return (
    <aside className="rounded-2xl border border-stone-300/70 bg-white/70 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
        Tarife bilgisi
      </p>
      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
        <MetaItem label="Şehir" value={cityLabel} />
        {segmentName ? (
          <MetaItem label="Segment" value={segmentName} />
        ) : null}
        <MetaItem label="Kaynak" value={sourceLabel} />
        <MetaItem
          label="Son senkron"
          value={fetchedAt || "—"}
        />
      </dl>
      {tariff?.sourceUrl && cityId !== "custom" ? (
        <a
          href={tariff.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-xs font-medium text-taxi-dim hover:underline dark:text-taxi"
        >
          Kaynak sayfası →
        </a>
      ) : null}
      <p className="mt-2 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
        {TARIFF_META.disclaimer} Resmî kurum değildir; taksimetre esas alınır.
      </p>
    </aside>
  );
}

function MetaItem({ label, value }) {
  return (
    <div>
      <dt className="text-[11px] text-stone-500 dark:text-stone-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink dark:text-stone-100">{value}</dd>
    </div>
  );
}
