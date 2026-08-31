import { Link, Navigate, useParams } from "react-router-dom";
import { PageShell } from "../components/PageShell.jsx";
import { useDocumentMeta } from "../hooks/useDocumentMeta.js";
import {
  SAMPLE_DISTANCES_KM,
  buildCityJsonLd,
  buildCitySeoMeta,
  cityPath,
  getSiteUrl,
  isKnownCityId,
  sampleFareForCity,
} from "../lib/citySeo.js";
import { formatDecimal, formatLira } from "../lib/formatCurrency.js";
import { FEATURED_CITY_IDS } from "../lib/provinces.js";
import {
  CITY_TARIFFS,
  formatFetchedAt,
  getCityTariff,
} from "../lib/tariffs.js";

export function CityTariffPage() {
  const { cityId } = useParams();
  const siteUrl = getSiteUrl();
  const known = isKnownCityId(cityId);
  const tariff = known ? getCityTariff(cityId) : null;
  const meta = tariff ? buildCitySeoMeta(tariff, { siteUrl }) : null;
  const jsonLd = tariff && meta ? buildCityJsonLd(tariff, meta) : null;
  const synced = formatFetchedAt();

  useDocumentMeta({
    title: meta?.title,
    description: meta?.description,
    canonical: meta?.canonical,
    jsonLd,
  });

  if (!known || !tariff) {
    return <Navigate to="/sehirler" replace />;
  }

  const samples = SAMPLE_DISTANCES_KM.map((km) => ({
    km,
    fare: sampleFareForCity(tariff, km),
  }));

  const related = FEATURED_CITY_IDS.filter((id) => id !== tariff.id)
    .map((id) => CITY_TARIFFS.find((city) => city.id === id))
    .filter(Boolean);

  return (
    <PageShell>
      <article className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-taxi-dim dark:text-taxi">
            {tariff.plate} · {tariff.shortName}
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            {tariff.name} taksi ücreti
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            {tariff.name} için güncel açılış, kilometre ve indi-bindi (taban)
            ücretleriyle örnek mesafe hesapları. Rakamlar bilgilendirme
            amaçlıdır; yolculukta resmi taksimetre esas alınır.
          </p>
        </div>

        <section
          aria-labelledby="tariff-table-title"
          className="overflow-hidden rounded-3xl border border-stone-300/70 bg-card shadow-sm dark:border-white/10 dark:bg-panel"
        >
          <div className="border-b border-stone-200/80 px-5 py-4 dark:border-white/10">
            <h2 id="tariff-table-title" className="text-lg font-semibold">
              Tarife özeti
            </h2>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              {synced ? `Son senkron: ${synced}` : "2026 tarifesi"}
              {tariff.source ? ` · kaynak: ${tariff.source}` : ""}
            </p>
          </div>
          <dl className="divide-y divide-stone-200/80 dark:divide-white/10">
            <TariffRow label="Açılış" value={`${formatDecimal(tariff.openingFee)} ₺`} />
            <TariffRow label="Km ücreti" value={`${formatDecimal(tariff.perKmFee)} ₺`} />
            <TariffRow
              label="Bekleme (dk)"
              value={
                tariff.perMinuteFee > 0
                  ? `${formatDecimal(tariff.perMinuteFee)} ₺`
                  : "Formdan girilir"
              }
            />
            <TariffRow
              label="İndi-bindi (minimum)"
              value={`${formatDecimal(tariff.minimumFee)} ₺`}
            />
          </dl>
        </section>

        <section
          aria-labelledby="samples-title"
          className="rounded-3xl border border-stone-300/70 bg-card p-5 shadow-sm dark:border-white/10 dark:bg-panel sm:p-6"
        >
          <h2 id="samples-title" className="text-lg font-semibold">
            Örnek mesafeler
          </h2>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Tek yön, bekleme ve geçiş yok. Kısa mesafede indi-bindi devreye
            girebilir.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {samples.map(({ km, fare }) => (
              <li
                key={km}
                className="rounded-2xl border border-stone-300/70 px-4 py-3 dark:border-white/10"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  {km} km
                </p>
                <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-ink dark:text-taxi">
                  {formatLira(fare.total)}
                </p>
                {fare.appliedMinimum ? (
                  <p className="mt-1 text-[11px] text-stone-500">İndi-bindi uygulandı</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            to={`/?city=${tariff.id}`}
            className="inline-flex items-center justify-center rounded-2xl bg-taxi px-5 py-3 text-sm font-semibold text-ink shadow-sm transition hover:brightness-95"
          >
            Bu tarife ile hesapla
          </Link>
          <Link
            to="/sehirler"
            className="inline-flex items-center justify-center rounded-2xl border border-stone-300/80 px-5 py-3 text-sm font-semibold transition hover:border-taxi dark:border-white/15"
          >
            Tüm iller
          </Link>
          {tariff.sourceUrl ? (
            <a
              href={tariff.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-2xl border border-stone-300/80 px-5 py-3 text-sm font-semibold transition hover:border-taxi dark:border-white/15"
            >
              Kaynak
            </a>
          ) : null}
        </div>

        {tariff.note ? (
          <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
            {tariff.note}
          </p>
        ) : null}

        {related.length ? (
          <section aria-labelledby="related-title" className="space-y-3">
            <h2 id="related-title" className="text-sm font-semibold">
              Diğer büyükşehirler
            </h2>
            <div className="flex flex-wrap gap-2">
              {related.map((city) => (
                <Link
                  key={city.id}
                  to={cityPath(city.id)}
                  className="rounded-2xl border border-stone-300/80 px-4 py-2 text-sm font-medium transition hover:border-taxi dark:border-white/15"
                >
                  {city.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </PageShell>
  );
}

function TariffRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
      <dt className="text-stone-600 dark:text-stone-300">{label}</dt>
      <dd className="font-mono font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
