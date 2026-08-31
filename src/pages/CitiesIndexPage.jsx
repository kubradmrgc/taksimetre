import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../components/PageShell.jsx";
import { useDocumentMeta } from "../hooks/useDocumentMeta.js";
import {
  buildCitiesIndexMeta,
  cityPath,
  getSiteUrl,
} from "../lib/citySeo.js";
import { FEATURED_CITY_IDS } from "../lib/provinces.js";
import { CITY_TARIFFS, TARIFF_META, formatFetchedAt } from "../lib/tariffs.js";

function foldTr(value) {
  return String(value ?? "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

export function CitiesIndexPage() {
  const [query, setQuery] = useState("");
  const siteUrl = getSiteUrl();
  const meta = buildCitiesIndexMeta({ siteUrl });

  useDocumentMeta({
    title: meta.title,
    description: meta.description,
    canonical: meta.canonical,
  });

  const featured = useMemo(
    () =>
      FEATURED_CITY_IDS.map((id) =>
        CITY_TARIFFS.find((city) => city.id === id),
      ).filter(Boolean),
    [],
  );

  const filtered = useMemo(() => {
    const needle = foldTr(query.trim());
    const list = !needle
      ? CITY_TARIFFS
      : CITY_TARIFFS.filter(
          (city) =>
            foldTr(city.name).includes(needle) ||
            foldTr(city.shortName).includes(needle) ||
            city.plate.includes(needle) ||
            city.id.includes(needle),
        );
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [query]);

  return (
    <PageShell>
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            İl taksi tarifeleri
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            {TARIFF_META.cityCount} il için açılış, km ve indi-bindi özetleri.
            Bir ile tıklayınca örnek mesafe hesaplarını ve hesaplayıcıya geçiş
            bağlantısını görürsünüz
            {formatFetchedAt() ? ` · senkron ${formatFetchedAt()}` : ""}.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {featured.map((city) => (
            <Link
              key={city.id}
              to={cityPath(city.id)}
              className="rounded-2xl border border-taxi/40 bg-taxi/15 px-3 py-3 text-left transition hover:border-taxi dark:bg-taxi/10"
            >
              <span className="block text-[11px] font-semibold tracking-wider opacity-70">
                {city.shortName}
              </span>
              <span className="mt-0.5 block text-sm font-semibold">{city.name}</span>
            </Link>
          ))}
        </div>

        <label className="block">
          <span className="text-sm font-medium">İl ara</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Örn. Bursa, 16, diyarbakir"
            className="mt-1.5 w-full rounded-xl border border-stone-300/80 bg-white px-3.5 py-2.5 text-base text-ink shadow-sm outline-none transition [color-scheme:light] focus:border-taxi focus:ring-2 focus:ring-taxi/30 dark:border-white/20"
          />
        </label>

        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((city) => (
            <li key={city.id}>
              <Link
                to={cityPath(city.id)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-stone-300/70 bg-card px-4 py-3 text-sm transition hover:border-taxi dark:border-white/10 dark:bg-panel"
              >
                <span>
                  <span className="font-semibold">{city.name}</span>
                  <span className="mt-0.5 block text-xs text-stone-500">
                    plaka {city.plate}
                  </span>
                </span>
                <span className="font-mono text-xs tabular-nums text-stone-500">
                  {city.perKmFee} ₺/km
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {filtered.length === 0 ? (
          <p className="text-sm text-stone-500">Eşleşen il yok.</p>
        ) : null}
      </div>
    </PageShell>
  );
}
