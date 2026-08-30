import tariffData from "../data/tariffs.json";
import { PROVINCES } from "./provinces.js";

/**
 * Dakika bedeli tabloda yoksa yerel tamamlayıcı:
 * İstanbul İBB 2026 saatlik bekleme 598,90 ₺ / 60;
 * Ankara 7 ₺/dk; İzmir 4 ₺/dk.
 * taksifiyat.online sync perMinuteFee yazdıysa o kullanılır.
 */
export const WAITING_FEE_FALLBACKS = {
  istanbul: Number((598.9 / 60).toFixed(2)),
  ankara: 7,
  izmir: 4,
};

const feesById = new Map(tariffData.cities.map((city) => [city.id, city]));

export const CITY_TARIFFS = PROVINCES.map((province) => {
  const fees = feesById.get(province.id);
  if (!fees) {
    throw new Error(`tariffs.json içinde ${province.id} yok; npm run sync:tariffs çalıştırın.`);
  }

  return {
    ...province,
    openingFee: fees.openingFee,
    perKmFee: fees.perKmFee,
    minimumFee: fees.minimumFee,
    perMinuteFee:
      fees.perMinuteFee ?? WAITING_FEE_FALLBACKS[province.id] ?? 0,
    note: fees.note,
    source: fees.source,
    sourceUrl: fees.sourceUrl,
  };
});

export const DEFAULT_CITY_ID = "istanbul";

export const TARIFF_META = {
  source: tariffData.source,
  sources: tariffData.sources ?? [],
  fetchedAt: tariffData.fetchedAt,
  disclaimer: tariffData.disclaimer,
  cityCount: CITY_TARIFFS.length,
};

export function getCityTariff(cityId) {
  return CITY_TARIFFS.find((city) => city.id === cityId) ?? CITY_TARIFFS[0];
}

export function tariffToFormValues(tariff) {
  return {
    openingFee: String(tariff.openingFee),
    perKmFee: String(tariff.perKmFee),
    perMinuteFee: String(tariff.perMinuteFee),
    minimumFee: String(tariff.minimumFee),
  };
}

export function formatFetchedAt(isoDate = TARIFF_META.fetchedAt) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
