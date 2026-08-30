const trLira = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const trDecimal = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatLira(amount) {
  return trLira.format(Number.isFinite(amount) ? amount : 0);
}

export function formatDecimal(amount) {
  return trDecimal.format(Number.isFinite(amount) ? amount : 0);
}
