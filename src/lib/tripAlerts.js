import { distanceToPolylineMeters } from "./geo.js";

/** Anlık tutar tahmini max'ı aşarsa. */
export const FARE_OVER_RATIO = 1;

/** Mesafe tahmini km'nin bu oranını aşarsa. */
export const DISTANCE_OVER_RATIO = 1.2;

/** Rotadan sapma eşiği (metre). */
export const ROUTE_DEVIATION_M = 250;

/**
 * Yolculuk sırasında fiyat / mesafe / rota sapmalarını değerlendirir.
 * @returns {{ level: 'ok' | 'warn' | 'danger', messages: string[] }}
 */
export function evaluateDeviation({
  estimate,
  fareTotal,
  distanceKm,
  currentPosition,
}) {
  if (!estimate) {
    return { level: "ok", messages: [] };
  }

  const messages = [];
  let level = "ok";

  if (
    Number.isFinite(estimate.maxFare) &&
    fareTotal > estimate.maxFare * FARE_OVER_RATIO
  ) {
    messages.push(
      `Anlık tutar tahmini üst sınırı (₺${estimate.maxFare.toFixed(2)}) aştı.`,
    );
    level = "danger";
  }

  if (
    Number.isFinite(estimate.distanceKm) &&
    distanceKm > estimate.distanceKm * DISTANCE_OVER_RATIO
  ) {
    messages.push(
      `Katedilen mesafe tahmini rotanın %${Math.round((DISTANCE_OVER_RATIO - 1) * 100)} üzerine çıktı.`,
    );
    level = level === "danger" ? "danger" : "warn";
  }

  if (
    currentPosition &&
    Array.isArray(estimate.polyline) &&
    estimate.polyline.length > 0
  ) {
    const offsetM = distanceToPolylineMeters(
      currentPosition.lat,
      currentPosition.lon,
      estimate.polyline,
    );

    if (offsetM > ROUTE_DEVIATION_M) {
      messages.push(
        `Tahmini rotadan yaklaşık ${Math.round(offsetM)} m saptınız.`,
      );
      level = "danger";
    }
  }

  return { level, messages };
}
