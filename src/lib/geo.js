/** Dünya yarıçapı (metre). */
const EARTH_RADIUS_M = 6_371_000;

/** GPS doğruluk üst sınırı; daha kötü örnekler yok sayılır. */
export const MAX_ACCURACY_M = 50;

/** Titreme / gürültü: bu mesafenin altı toplam mesafeye eklenmez. */
export const MIN_MOVE_M = 8;

/** Fiziksel olarak imkânsız sıçrama eşiği (km/s). */
export const MAX_SPEED_KMH = 160;

/** Bekleme sayacı için hız eşiği (km/s). */
export const WAITING_SPEED_KMH = 10;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function haversineMeters(lat1, lon1, lat2, lon2) {
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

export function speedKmh(distanceKm, deltaSeconds) {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return 0;
  return distanceKm / (deltaSeconds / 3600);
}


export function evaluateGpsSample(previous, next) {
  const accuracy =
    typeof next.accuracy === "number" && Number.isFinite(next.accuracy)
      ? next.accuracy
      : null;

  if (accuracy != null && accuracy > MAX_ACCURACY_M) {
    return { accept: false, reason: "accuracy" };
  }

  if (!previous) {
    return {
      accept: true,
      distanceM: 0,
      distanceKm: 0,
      deltaSeconds: 0,
      speedKmh: 0,
      isWaiting: false,
    };
  }

  const deltaSeconds = Math.max(0, (next.timestamp - previous.timestamp) / 1000);
  const distanceM = haversineMeters(
    previous.lat,
    previous.lon,
    next.lat,
    next.lon,
  );
  const distanceKm = distanceM / 1000;
  const speed = speedKmh(distanceKm, deltaSeconds);

  if (distanceM < MIN_MOVE_M) {
    return {
      accept: true,
      distanceM: 0,
      distanceKm: 0,
      deltaSeconds,
      speedKmh: speed,
      isWaiting: speed < WAITING_SPEED_KMH || distanceM < MIN_MOVE_M,
      skipDistance: true,
    };
  }

  if (speed > MAX_SPEED_KMH) {
    return { accept: false, reason: "speed" };
  }

  return {
    accept: true,
    distanceM,
    distanceKm,
    deltaSeconds,
    speedKmh: speed,
    isWaiting: speed < WAITING_SPEED_KMH,
    skipDistance: false,
  };
}


export function distanceToPolylineMeters(lat, lon, polyline) {
  if (!Array.isArray(polyline) || polyline.length === 0) return Infinity;

  let min = Infinity;
  for (const point of polyline) {
    const [pLon, pLat] = point;
    const d = haversineMeters(lat, lon, pLat, pLon);
    if (d < min) min = d;
  }
  return min;
}

export function formatDuration(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
