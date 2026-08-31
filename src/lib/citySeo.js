import { calculateFare } from "./calculateFare.js";
import { formatDecimal, formatLira } from "./formatCurrency.js";
import { CITY_TARIFFS, TARIFF_META, formatFetchedAt } from "./tariffs.js";

export const SAMPLE_DISTANCES_KM = [5, 10, 20];

export function cityPath(cityId) {
  return `/sehir/${cityId}`;
}

export function isKnownCityId(cityId) {
  return CITY_TARIFFS.some((city) => city.id === cityId);
}

/**
 * Örnek mesafe için tek yön, beklemesiz, geçişsiz ücret.
 */
export function sampleFareForCity(tariff, distanceKm) {
  return calculateFare({
    distanceKm,
    waitingMinutes: 0,
    openingFee: tariff.openingFee,
    perKmFee: tariff.perKmFee,
    perMinuteFee: tariff.perMinuteFee,
    minimumFee: tariff.minimumFee,
    tolls: 0,
    roundTrip: false,
  });
}

export function buildCitySeoMeta(tariff, { siteUrl = "" } = {}) {
  const sample = sampleFareForCity(tariff, 10);
  const synced = formatFetchedAt() || "2026";
  const title = `${tariff.name} Taksi Ücreti 2026 | Taksimetre`;
  const description = `${tariff.name} taksi tarifesi: açılış ${formatDecimal(tariff.openingFee)} ₺, km ${formatDecimal(tariff.perKmFee)} ₺, indi-bindi ${formatDecimal(tariff.minimumFee)} ₺. 10 km örnek: ${formatLira(sample.total)}. Güncelleme: ${synced}.`;
  const path = cityPath(tariff.id);
  const canonical = siteUrl ? `${siteUrl.replace(/\/$/, "")}${path}` : path;

  return {
    title,
    description,
    path,
    canonical,
    cityName: tariff.name,
    sample10Km: sample.total,
  };
}

export function buildCityJsonLd(tariff, meta) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: meta.title,
    description: meta.description,
    url: meta.canonical,
    about: {
      "@type": "City",
      name: tariff.name,
    },
    isPartOf: {
      "@type": "WebSite",
      name: "Taksimetre",
    },
  };
}

export function buildDefaultSeoMeta({ siteUrl = "" } = {}) {
  const path = "/";
  return {
    title: "Taksimetre | Türkiye Taksi Ücreti Hesaplama",
    description:
      "81 il taksi tarifesiyle mesafe, bekleme ve geçişlere göre anlık ücret hesaplayın. Canlı yolculuk, duraklar ve şikayet hatları.",
    path,
    canonical: siteUrl ? `${siteUrl.replace(/\/$/, "")}${path}` : path,
  };
}

export function buildCitiesIndexMeta({ siteUrl = "" } = {}) {
  const path = "/sehirler";
  return {
    title: "81 İl Taksi Tarifeleri 2026 | Taksimetre",
    description: `Türkiye'nin ${TARIFF_META.cityCount} ili için güncel taksi açılış, km ve indi-bindi ücretleri. Şehir seçip örnek mesafe hesabını görün.`,
    path,
    canonical: siteUrl ? `${siteUrl.replace(/\/$/, "")}${path}` : path,
  };
}

export function getSiteUrl() {
  const raw = import.meta.env.VITE_SITE_URL;
  if (typeof raw === "string" && raw.trim()) {
    return raw.trim().replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}
