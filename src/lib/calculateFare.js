/**
 * Ücret hesabı: açılış + km + bekleme; indi-bindi tabanı; isteğe bağlı ×2 ve geçişler.
 */
export function calculateFare({
  distanceKm,
  waitingMinutes,
  openingFee,
  perKmFee,
  perMinuteFee,
  minimumFee,
  tolls = 0,
  roundTrip = false,
}) {
  const distance = toNonNegativeNumber(distanceKm);
  const waiting = toNonNegativeNumber(waitingMinutes);
  const opening = toNonNegativeNumber(openingFee);
  const kmRate = toNonNegativeNumber(perKmFee);
  const minuteRate = toNonNegativeNumber(perMinuteFee);
  const minimum = toNonNegativeNumber(minimumFee);
  const tollAmount = toNonNegativeNumber(tolls);
  const legs = roundTrip ? 2 : 1;

  const distanceCost = distance * kmRate;
  const waitingCost = waiting * minuteRate;
  const subtotal = opening + distanceCost + waitingCost;
  const appliedMinimum = subtotal < minimum;
  const oneWayTotal = appliedMinimum ? minimum : subtotal;
  const tripTotal = oneWayTotal * legs;
  const total = tripTotal + tollAmount;

  return {
    openingFee: opening,
    distanceCost,
    waitingCost,
    subtotal,
    minimumFee: minimum,
    appliedMinimum,
    oneWayTotal,
    tripTotal,
    tolls: tollAmount,
    roundTrip: Boolean(roundTrip),
    legs,
    total,
  };
}

export function toNonNegativeNumber(value) {
  if (value === "" || value == null) return 0;

  const normalized = String(value).trim().replace(",", ".");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}
