import { distanceToPolylineMeters } from "./geo.js";
import { evaluateFareAgainstRange, mergeAlerts } from "./fareRange.js";

/** Mesafe tahmini km'nin bu oranını aşarsa. */
export const DISTANCE_OVER_RATIO = 1.2;

/** Rotadan sapma eşiği (metre). */
export const ROUTE_DEVIATION_M = 250;

/**
 * Yolculuk / hesap sırasında fiyat aralığı, mesafe ve rota sapmalarını değerlendirir.
 * @returns {{ level: 'ok' | 'warn' | 'danger', messages: string[], rangeStatus?: string }}
 */
export function evaluateDeviation({
  estimate,
  fareTotal,
  distanceKm,
  currentPosition,
  fareRange = null,
  checkBelow = true,
}) {
  const range = fareRange ?? estimate;
  const fareAlert = evaluateFareAgainstRange(fareTotal, range, { checkBelow });

  if (!estimate && !fareRange) {
    return fareAlert;
  }

  const messages = [...fareAlert.messages];
  let level = fareAlert.level;

  if (
    estimate &&
    Number.isFinite(estimate.distanceKm) &&
    distanceKm > estimate.distanceKm * DISTANCE_OVER_RATIO
  ) {
    messages.push(
      `Katedilen mesafe tahmini rotanın %${Math.round((DISTANCE_OVER_RATIO - 1) * 100)} üzerine çıktı. Mesafe verisi sorunlu olabilir.`,
    );
    level = level === "danger" ? "danger" : "warn";
  }

  if (
    estimate &&
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
        `Tahmini rotadan yaklaşık ${Math.round(offsetM)} m saptınız. Konum veya güzergâh şüpheli olabilir.`,
      );
      level = "danger";
    }
  }

  return mergeAlerts(fareAlert, { level, messages });
}
