import { buildFareRange } from "./fareRange.js";
import { PROVINCES } from "./provinces.js";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

/** İl merkezi yedeği (konum yoksa rota başlangıcı). */
export const CITY_CENTERS = Object.fromEntries(
  PROVINCES.map((city) => [city.id, { lat: city.lat, lon: city.lon }]),
);
CITY_CENTERS.custom = CITY_CENTERS.istanbul;

/** Nominatim adres / yer araması (TR). */
export async function searchPlaces(query, { signal, limit = 5 } = {}) {
  const trimmed = String(query || "").trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    q: trimmed,
    format: "json",
    addressdetails: "1",
    limit: String(limit),
    countrycodes: "tr",
  });

  const response = await fetch(`${NOMINATIM_URL}?${params}`, {
    signal,
    headers: {
      Accept: "application/json",
      "Accept-Language": "tr",
    },
  });

  if (!response.ok) {
    throw new Error("Adres araması başarısız oldu. Biraz sonra tekrar deneyin.");
  }

  const data = await response.json();
  return data.map((item) => ({
    id: String(item.place_id),
    label: item.display_name,
    lat: Number(item.lat),
    lon: Number(item.lon),
  }));
}

/** OSRM sürüş rotası: km, süre, polyline. */
export async function fetchDrivingRoute(from, to, { signal } = {}) {
  const coords = `${from.lon},${from.lat};${to.lon},${to.lat}`;
  const url = `${OSRM_URL}/${coords}?overview=full&geometries=geojson`;

  const response = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Rota hesaplanamadı. Bağlantınızı kontrol edin.");
  }

  const data = await response.json();
  const route = data.routes?.[0];

  if (!route) {
    throw new Error("Bu noktalar arasında sürüş rotası bulunamadı.");
  }

  return {
    distanceKm: route.distance / 1000,
    durationSeconds: route.duration,
    polyline: route.geometry?.coordinates ?? [],
  };
}

export function estimateFareRange(route, tariff) {
  return buildFareRange({
    distanceKm: route.distanceKm,
    durationSeconds: route.durationSeconds,
    openingFee: tariff.openingFee,
    perKmFee: tariff.perKmFee,
    perMinuteFee: tariff.perMinuteFee,
    minimumFee: tariff.minimumFee,
    tolls: tariff.tolls,
    roundTrip: tariff.roundTrip,
  });
}

export function getFallbackOrigin(cityId) {
  return CITY_CENTERS[cityId] ?? CITY_CENTERS.istanbul;
}

/** Tek seferlik geolocation; reddedilirse null. */
export function getCurrentPositionOnce(options = {}) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60_000,
        ...options,
      },
    );
  });
}
