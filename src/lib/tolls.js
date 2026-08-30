/**
 * İstanbul köprü / tünel geçişleri (HGS sınıf 1 otomobil, yaklaşık 2026).
 * Resmî güncel tutar için operatör tablosunu kontrol edin.
 */
export const ISTANBUL_TOLLS = [
  {
    id: "bogazici",
    name: "15 Temmuz Şehitler / Boğaziçi",
    amount: 47,
  },
  {
    id: "fsm",
    name: "Fatih Sultan Mehmet",
    amount: 47,
  },
  {
    id: "yss",
    name: "Yavuz Sultan Selim",
    amount: 115,
  },
  {
    id: "avrasya",
    name: "Avrasya Tüneli",
    amount: 137,
  },
];

export function sumTollIds(selectedIds, catalog = ISTANBUL_TOLLS) {
  const set = new Set(selectedIds ?? []);
  return catalog.reduce(
    (sum, toll) => (set.has(toll.id) ? sum + toll.amount : sum),
    0,
  );
}
