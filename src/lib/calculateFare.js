/**
 * Taksimetre ücret hesabı.
 *
 * Temel formül:
 *   araToplam = açılış + (mesafeKm × kmBaşıÜcret) + (beklemeDk × dakikaBaşıÜcret)
 *
 * Taban ücret kuralı:
 *   Hesaplanan ara toplam, girilen minimum (indi-bindi) ücretten küçükse
 *   yolcuya yansıtılan nihai tutar indi-bindi ücretidir.
 */
export function calculateFare({
  distanceKm,
  waitingMinutes,
  openingFee,
  perKmFee,
  perMinuteFee,
  minimumFee,
}) {
  const distance = toNonNegativeNumber(distanceKm);
  const waiting = toNonNegativeNumber(waitingMinutes);
  const opening = toNonNegativeNumber(openingFee);
  const kmRate = toNonNegativeNumber(perKmFee);
  const minuteRate = toNonNegativeNumber(perMinuteFee);
  const minimum = toNonNegativeNumber(minimumFee);

  const distanceCost = distance * kmRate;
  const waitingCost = waiting * minuteRate;
  const subtotal = opening + distanceCost + waitingCost;
  const appliedMinimum = subtotal < minimum;
  const total = appliedMinimum ? minimum : subtotal;

  return {
    openingFee: opening,
    distanceCost,
    waitingCost,
    subtotal,
    minimumFee: minimum,
    appliedMinimum,
    total,
  };
}

/** Boş, negatif veya geçersiz girdileri 0 kabul eder. */
export function toNonNegativeNumber(value) {
  if (value === "" || value == null) return 0;

  const normalized = String(value).trim().replace(",", ".");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}
