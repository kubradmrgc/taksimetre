/**
 * Büyükşehir sarı taksi tarifeleri (2026 belediye / oda duyuruları).
 *
 * Dakika başı bekleme ücreti, duyurulan saatlik bedelin 60'a bölümüdür.
 * Resmi tarife değişebileceği için değerler formda düzenlenebilir bırakılmıştır.
 */
export const CITY_TARIFFS = [
  {
    id: "istanbul",
    name: "İstanbul",
    shortName: "İST",
    note: "İBB, 20 Temmuz 2026 · sarı taksi",
    openingFee: 71.94,
    perKmFee: 47.92,
    perMinuteFee: Number((598.9 / 60).toFixed(2)),
    minimumFee: 230,
  },
  {
    id: "ankara",
    name: "Ankara",
    shortName: "ANK",
    note: "ABB, 1 Mart 2026",
    openingFee: 65,
    perKmFee: 40,
    perMinuteFee: 7,
    minimumFee: 200,
  },
  {
    id: "izmir",
    name: "İzmir",
    shortName: "İZM",
    note: "İzBB, 1 Mayıs 2026",
    openingFee: 40,
    perKmFee: 54,
    perMinuteFee: 4,
    minimumFee: 210,
  },
];

export const DEFAULT_CITY_ID = "istanbul";

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
