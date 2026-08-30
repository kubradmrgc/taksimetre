import { calculateFare, toNonNegativeNumber } from "./calculateFare.js";

/**
 * Mesafe / süre / tarife ile beklenen ücret aralığı (min–ort–max).
 *
 * Min: verilen km, 0 dk bekleme (indi-bindi dahil)
 * Ortalama: km + mevcut bekleme (yoksa süre tahmini × %25)
 * Max: km × 1.15 + bekleme × 1.8 (veya süre × %45)
 */
export function buildFareRange({
  distanceKm,
  waitingMinutes = 0,
  durationSeconds = 0,
  openingFee,
  perKmFee,
  perMinuteFee,
  minimumFee,
  tolls = 0,
  roundTrip = false,
}) {
  const distance = toNonNegativeNumber(distanceKm);
  const waiting = toNonNegativeNumber(waitingMinutes);
  const durationMinutes = toNonNegativeNumber(durationSeconds) / 60;
  const tollAmount = toNonNegativeNumber(tolls);
  const legs = roundTrip ? 2 : 1;

  const base = {
    openingFee,
    perKmFee,
    perMinuteFee,
    minimumFee,
  };

  const avgWaiting =
    waiting > 0 ? waiting : durationMinutes > 0 ? durationMinutes * 0.25 : 0;
  const maxWaiting =
    waiting > 0
      ? waiting * 1.8
      : durationMinutes > 0
        ? durationMinutes * 0.45
        : distance > 0
          ? Math.max(2, distance * 0.4)
          : 0;

  const minFare =
    calculateFare({
      ...base,
      distanceKm: distance,
      waitingMinutes: 0,
    }).total *
      legs +
    tollAmount;

  const avgFare =
    calculateFare({
      ...base,
      distanceKm: distance,
      waitingMinutes: avgWaiting,
    }).total *
      legs +
    tollAmount;

  const maxFare =
    calculateFare({
      ...base,
      distanceKm: distance * 1.15,
      waitingMinutes: maxWaiting,
    }).total *
      legs +
    tollAmount;

  return {
    minFare,
    avgFare,
    maxFare: Math.max(maxFare, avgFare, minFare),
    distanceKm: distance,
    durationSeconds: toNonNegativeNumber(durationSeconds),
  };
}

/**
 * Anlık tutarın beklenen aralık içinde olup olmadığını değerlendirir.
 * Aralık dışındaki değerler sorunlu / şüpheli kabul edilir.
 *
 * @param {object} [options]
 * @param {boolean} [options.checkBelow=true] Yolculuk başında düşük tutar için kapatılabilir.
 */
export function evaluateFareAgainstRange(fareTotal, range, options = {}) {
  const { checkBelow = true } = options;

  if (
    !range ||
    !Number.isFinite(range.minFare) ||
    !Number.isFinite(range.maxFare)
  ) {
    return { level: "ok", status: "unknown", messages: [] };
  }

  const total = Number(fareTotal);
  if (!Number.isFinite(total)) {
    return { level: "ok", status: "unknown", messages: [] };
  }

  const min = range.minFare;
  const max = range.maxFare;
  const messages = [];

  if (checkBelow && total < min - 0.005) {
    messages.push(
      `Hesaplanan tutar beklenen aralığın altında (${formatBand(min, max)}). Tarife veya mesafe hatalı olabilir.`,
    );
    return { level: "warn", status: "below", messages };
  }

  if (total > max + 0.005) {
    messages.push(
      `Hesaplanan tutar beklenen aralığın üzerinde (${formatBand(min, max)}). Tutar şişirilmiş veya sapmalı olabilir.`,
    );
    return { level: "danger", status: "above", messages };
  }

  return { level: "ok", status: "inside", messages: [] };
}

function formatBand(min, max) {
  return `₺${min.toFixed(2)} – ₺${max.toFixed(2)}`;
}

/** İki uyarı sonucunu birleştirir (daha yüksek seviye kazanır). */
export function mergeAlerts(...alerts) {
  const rank = { ok: 0, warn: 1, danger: 2 };
  let level = "ok";
  const messages = [];
  const seen = new Set();

  for (const alert of alerts) {
    if (!alert) continue;
    if (rank[alert.level] > rank[level]) level = alert.level;
    for (const message of alert.messages ?? []) {
      if (seen.has(message)) continue;
      seen.add(message);
      messages.push(message);
    }
  }

  return { level, messages };
}
