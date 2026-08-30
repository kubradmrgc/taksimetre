import chambersData from "../data/chambersData.json";
import { haversineMeters } from "./geo.js";
import { getCurrentPositionOnce } from "./routing.js";
import { getProvince, PROVINCES } from "./provinces.js";

const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const DEFAULT_RADIUS_M = 2500;
const MAX_STANDS = 15;

function foldTr(value) {
  return String(value ?? "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/[^\d+]/g, "");
  return digits.length >= 3 ? digits : null;
}

function telHref(phone) {
  const normalized = normalizePhone(phone);
  return normalized ? `tel:${normalized}` : null;
}

function matchCityId(cityName) {
  if (!cityName) return null;
  const folded = foldTr(cityName);

  const exact = PROVINCES.find(
    (city) =>
      foldTr(city.name) === folded ||
      foldTr(city.name).includes(folded) ||
      folded.includes(foldTr(city.name)),
  );
  return exact?.id ?? null;
}

/**
 * chambersData.json içinden şehir + ulusal şikayet / oda iletişimlerini döner.
 */
export function getChamberContacts(cityId) {
  const city = chambersData.cities.find((item) => item.id === cityId);
  const cityContacts = city?.contacts ?? [];

  return {
    cityId: city?.id ?? cityId ?? null,
    cityName: city?.name ?? PROVINCES.find((p) => p.id === cityId)?.name ?? null,
    disclaimer: chambersData.disclaimer,
    national: chambersData.national,
    contacts: cityContacts,
    all: [...chambersData.national, ...cityContacts],
  };
}

/**
 * Konumdan il adını bulur (Nominatim reverse geocode).
 */
export async function detectCityFromPosition(position, { signal } = {}) {
  if (!position?.lat || !position?.lon) {
    return { cityId: null, cityName: null, raw: null };
  }

  const params = new URLSearchParams({
    lat: String(position.lat),
    lon: String(position.lon),
    format: "json",
    addressdetails: "1",
    zoom: "10",
  });

  const response = await fetch(`${NOMINATIM_REVERSE}?${params}`, {
    signal,
    headers: {
      Accept: "application/json",
      "Accept-Language": "tr",
    },
  });

  if (!response.ok) {
    throw new Error("Konumdan şehir tespit edilemedi.");
  }

  const data = await response.json();
  const address = data.address ?? {};
  const cityName =
    address.province ||
    address.state ||
    address.city ||
    address.town ||
    address.county ||
    null;

  return {
    cityId: matchCityId(cityName),
    cityName,
    raw: address,
  };
}

function mapOverpassElement(element, origin) {
  const tags = element.tags ?? {};
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (lat == null || lon == null) return null;

  const distanceM = haversineMeters(origin.lat, origin.lon, lat, lon);
  const phone = normalizePhone(tags.phone || tags["contact:phone"] || tags.mobile);

  return {
    id: `osm-${element.type}-${element.id}`,
    name: tags.name || tags.operator || "Taksi durağı",
    phone,
    telHref: telHref(phone),
    distanceM,
    distanceLabel:
      distanceM >= 1000
        ? `${(distanceM / 1000).toFixed(1)} km`
        : `${Math.round(distanceM)} m`,
    lat,
    lon,
    source: "overpass",
    address: tags["addr:full"] || tags["addr:street"] || null,
  };
}

/**
 * OpenStreetMap Overpass ile yakındaki taksi durakları (anahtar gerekmez).
 */
export async function fetchNearbyStandsOverpass(
  position,
  { radiusM = DEFAULT_RADIUS_M, signal } = {},
) {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="taxi"](around:${radiusM},${position.lat},${position.lon});
      way["amenity"="taxi"](around:${radiusM},${position.lat},${position.lon});
      node["amenity"="taxi_office"](around:${radiusM},${position.lat},${position.lon});
      node["office"="taxi"](around:${radiusM},${position.lat},${position.lon});
    );
    out center tags;
  `;

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Accept: "application/json",
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error("Yakındaki taksi durakları alınamadı (Overpass).");
  }

  const data = await response.json();
  const stands = (data.elements ?? [])
    .map((element) => mapOverpassElement(element, position))
    .filter(Boolean)
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, MAX_STANDS);

  return { stands, provider: "overpass" };
}

/**
 * Google Places Nearby Search + Place Details (telefon).
 * VITE_GOOGLE_PLACES_API_KEY tanımlıysa kullanılır.
 * Geliştirmede istekler Vite proxy (`/api/google-places`) üzerinden gider (CORS).
 */
export async function fetchNearbyStandsGoogle(
  position,
  { radiusM = DEFAULT_RADIUS_M, signal } = {},
) {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GOOGLE_PLACES_API_KEY tanımlı değil.");
  }

  const useProxy = import.meta.env.DEV;
  const nearbyBase = useProxy
    ? "/api/google-places/nearbysearch/json"
    : "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

  const nearbyUrl = new URL(nearbyBase, window.location.origin);
  nearbyUrl.searchParams.set("location", `${position.lat},${position.lon}`);
  nearbyUrl.searchParams.set("radius", String(radiusM));
  nearbyUrl.searchParams.set("keyword", "taksi durağı");
  nearbyUrl.searchParams.set("language", "tr");
  if (!useProxy) nearbyUrl.searchParams.set("key", apiKey);

  const nearbyResponse = await fetch(nearbyUrl.toString(), { signal });
  if (!nearbyResponse.ok) {
    throw new Error("Google Places Nearby Search başarısız.");
  }

  const nearby = await nearbyResponse.json();
  if (nearby.status !== "OK" && nearby.status !== "ZERO_RESULTS") {
    throw new Error(`Google Places: ${nearby.status}`);
  }

  const results = (nearby.results ?? []).slice(0, MAX_STANDS);
  const stands = [];

  for (const place of results) {
    const lat = place.geometry?.location?.lat;
    const lon = place.geometry?.location?.lng;
    if (lat == null || lon == null) continue;

    let phone = null;
    if (place.place_id) {
      try {
        const detailsBase = useProxy
          ? "/api/google-places/details/json"
          : "https://maps.googleapis.com/maps/api/place/details/json";
        const detailsUrl = new URL(detailsBase, window.location.origin);
        detailsUrl.searchParams.set("place_id", place.place_id);
        detailsUrl.searchParams.set("fields", "formatted_phone_number,name");
        detailsUrl.searchParams.set("language", "tr");
        if (!useProxy) detailsUrl.searchParams.set("key", apiKey);

        const detailsResponse = await fetch(detailsUrl.toString(), { signal });
        if (detailsResponse.ok) {
          const details = await detailsResponse.json();
          phone = normalizePhone(details.result?.formatted_phone_number);
        }
      } catch {
        /* telefon opsiyonel */
      }
    }

    const distanceM = haversineMeters(position.lat, position.lon, lat, lon);
    stands.push({
      id: `ggl-${place.place_id}`,
      name: place.name || "Taksi durağı",
      phone,
      telHref: telHref(phone),
      distanceM,
      distanceLabel:
        distanceM >= 1000
          ? `${(distanceM / 1000).toFixed(1)} km`
          : `${Math.round(distanceM)} m`,
      lat,
      lon,
      source: "google",
      address: place.vicinity || null,
    });
  }

  stands.sort((a, b) => a.distanceM - b.distanceM);
  return { stands, provider: "google" };
}

/**
 * Yakındaki duraklar: anahtar varsa Google, yoksa Overpass.
 */
export async function fetchNearbyTaxiStands(position, options = {}) {
  const hasGoogleKey = Boolean(import.meta.env.VITE_GOOGLE_PLACES_API_KEY);

  if (hasGoogleKey) {
    try {
      return await fetchNearbyStandsGoogle(position, options);
    } catch (error) {
      console.warn("Google Places başarısız, Overpass deneniyor:", error);
    }
  }

  return fetchNearbyStandsOverpass(position, options);
}

/**
 * Seçilen il merkezine göre yakındaki taksi duraklarını çeker.
 */
export async function fetchStandsForCity(cityId, { signal, radiusM } = {}) {
  const province = getProvince(cityId);
  if (!province?.lat || !province?.lon) {
    throw new Error("Şehir merkezi bulunamadı.");
  }

  const position = { lat: province.lat, lon: province.lon };
  const result = await fetchNearbyTaxiStands(position, { signal, radiusM });

  return {
    ...result,
    position,
    cityId: province.id,
    cityName: province.name,
  };
}

/**
 * Konum al → şehir tespit et → oda bilgileri + yakındaki duraklar.
 * standCityId verilirse duraklar o il merkezine göre aranır.
 */
export async function loadContactContext({
  preferredCityId = null,
  standCityId = null,
  signal,
} = {}) {
  const position = await getCurrentPositionOnce();

  let detectedCity = { cityId: preferredCityId, cityName: null };
  if (position) {
    try {
      detectedCity = await detectCityFromPosition(position, { signal });
    } catch {
      detectedCity = { cityId: preferredCityId, cityName: null };
    }
  }

  const cityId =
    standCityId || detectedCity.cityId || preferredCityId || "istanbul";
  const chambers = getChamberContacts(
    detectedCity.cityId || preferredCityId || cityId,
  );

  let stands = [];
  let standsProvider = null;
  let standsError = null;
  let searchPosition = position;

  try {
    if (standCityId || !position) {
      const cityResult = await fetchStandsForCity(cityId, { signal });
      stands = cityResult.stands;
      standsProvider = cityResult.provider;
      searchPosition = cityResult.position;
    } else {
      const result = await fetchNearbyTaxiStands(position, { signal });
      stands = result.stands;
      standsProvider = result.provider;
    }
  } catch (error) {
    standsError = error.message || "Duraklar yüklenemedi.";
  }

  const messages = [];
  if (!position) {
    messages.push(
      "Konum alınamadı. Duraklar seçilen şehir merkezine göre listeleniyor.",
    );
  }
  if (standsError) messages.push(standsError);

  return {
    position: searchPosition,
    userPosition: position,
    detectedCity,
    standCityId: cityId,
    chambers,
    stands,
    standsProvider,
    error: messages.length ? messages.join(" ") : null,
  };
}

export { telHref, normalizePhone };
