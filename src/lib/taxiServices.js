import chambersData from "../data/chambersData.json";
import { haversineMeters } from "./geo.js";
import { getCurrentPositionOnce } from "./routing.js";
import { getProvince, PROVINCES } from "./provinces.js";

const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse";
const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

/** GPS / yakınım araması */
const NEARBY_RADIUS_M = 4_000;
/** İl merkezi seçildiğinde daha geniş alan */
const CITY_RADIUS_M = 12_000;
const MAX_STANDS = 20;

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

function distanceLabel(distanceM) {
  return distanceM >= 1000
    ? `${(distanceM / 1000).toFixed(1)} km`
    : `${Math.round(distanceM)} m`;
}

function makeStand({
  id,
  name,
  phone,
  lat,
  lon,
  origin,
  source,
  address = null,
}) {
  const distanceM = haversineMeters(origin.lat, origin.lon, lat, lon);
  const normalized = normalizePhone(phone);
  return {
    id,
    name: name || "Taksi durağı",
    phone: normalized,
    telHref: telHref(normalized),
    distanceM,
    distanceLabel: distanceLabel(distanceM),
    lat,
    lon,
    source,
    address,
  };
}

function dedupeStands(stands) {
  const seen = new Set();
  const unique = [];

  for (const stand of stands) {
    const key = `${foldTr(stand.name)}|${stand.lat.toFixed(4)}|${stand.lon.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(stand);
  }

  return unique.sort((a, b) => a.distanceM - b.distanceM).slice(0, MAX_STANDS);
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

export function getConfiguredStandProviders() {
  return {
    google: Boolean(import.meta.env.VITE_GOOGLE_PLACES_API_KEY),
    foursquare: Boolean(import.meta.env.VITE_FOURSQUARE_API_KEY),
    geoapify: Boolean(import.meta.env.VITE_GEOAPIFY_API_KEY),
  };
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

function googlePlacesBase(path) {
  const useProxy = import.meta.env.DEV;
  if (useProxy) {
    return new URL(`/api/google-places/${path}`, window.location.origin);
  }
  return new URL(`https://maps.googleapis.com/maps/api/place/${path}`);
}

async function googlePlaceDetailsPhone(placeId, signal) {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  const useProxy = import.meta.env.DEV;
  const detailsUrl = googlePlacesBase("details/json");
  detailsUrl.searchParams.set("place_id", placeId);
  detailsUrl.searchParams.set(
    "fields",
    "formatted_phone_number,international_phone_number,name",
  );
  detailsUrl.searchParams.set("language", "tr");
  if (!useProxy) detailsUrl.searchParams.set("key", apiKey);

  const response = await fetch(detailsUrl.toString(), { signal });
  if (!response.ok) return null;
  const data = await response.json();
  return normalizePhone(
    data.result?.formatted_phone_number ||
      data.result?.international_phone_number,
  );
}

/**
 * Google Places: Nearby Search + Text Search (daha geniş kapsama).
 */
export async function fetchNearbyStandsGoogle(
  position,
  { radiusM = NEARBY_RADIUS_M, signal } = {},
) {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GOOGLE_PLACES_API_KEY tanımlı değil.");
  }

  const useProxy = import.meta.env.DEV;
  const location = `${position.lat},${position.lon}`;
  const queries = [
    { type: "nearby", keyword: "taksi durağı" },
    { type: "nearby", keyword: "taxi stand" },
    { type: "text", query: "taksi durağı" },
    { type: "text", query: "taxi" },
  ];

  const placeMap = new Map();

  for (const item of queries) {
    const url =
      item.type === "nearby"
        ? googlePlacesBase("nearbysearch/json")
        : googlePlacesBase("textsearch/json");

    url.searchParams.set("location", location);
    url.searchParams.set("radius", String(radiusM));
    url.searchParams.set("language", "tr");
    if (item.type === "nearby") {
      url.searchParams.set("keyword", item.keyword);
    } else {
      url.searchParams.set("query", item.query);
    }
    if (!useProxy) url.searchParams.set("key", apiKey);

    try {
      const response = await fetch(url.toString(), { signal });
      if (!response.ok) continue;
      const data = await response.json();
      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") continue;

      for (const place of data.results ?? []) {
        if (!place.place_id || placeMap.has(place.place_id)) continue;
        placeMap.set(place.place_id, place);
      }
    } catch {
      /* sorgu atlanır */
    }
  }

  if (placeMap.size === 0) {
    return { stands: [], provider: "google" };
  }

  const stands = [];
  for (const place of [...placeMap.values()].slice(0, MAX_STANDS)) {
    const lat = place.geometry?.location?.lat;
    const lon = place.geometry?.location?.lng;
    if (lat == null || lon == null) continue;

    let phone = null;
    try {
      phone = await googlePlaceDetailsPhone(place.place_id, signal);
    } catch {
      /* telefon opsiyonel */
    }

    stands.push(
      makeStand({
        id: `ggl-${place.place_id}`,
        name: place.name,
        phone,
        lat,
        lon,
        origin: position,
        source: "google",
        address: place.vicinity || place.formatted_address || null,
      }),
    );
  }

  return { stands: dedupeStands(stands), provider: "google" };
}

/**
 * Foursquare Places API v3 — küresel POI.
 */
export async function fetchNearbyStandsFoursquare(
  position,
  { radiusM = NEARBY_RADIUS_M, signal } = {},
) {
  const apiKey = import.meta.env.VITE_FOURSQUARE_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_FOURSQUARE_API_KEY tanımlı değil.");
  }

  const useProxy = import.meta.env.DEV;
  const url = useProxy
    ? new URL("/api/foursquare/places/search", window.location.origin)
    : new URL("https://api.foursquare.com/v3/places/search");

  url.searchParams.set("ll", `${position.lat},${position.lon}`);
  url.searchParams.set("radius", String(radiusM));
  url.searchParams.set("query", "taxi");
  url.searchParams.set("limit", String(MAX_STANDS));
  url.searchParams.set("fields", "fsq_id,name,location,tel,distance");

  const response = await fetch(url.toString(), {
    signal,
    headers: useProxy
      ? { Accept: "application/json" }
      : {
          Accept: "application/json",
          Authorization: apiKey,
        },
  });

  if (!response.ok) {
    throw new Error("Foursquare Places araması başarısız.");
  }

  const data = await response.json();
  const stands = (data.results ?? [])
    .map((place) => {
      const lat = place.location?.latitude ?? place.geocodes?.main?.latitude;
      const lon = place.location?.longitude ?? place.geocodes?.main?.longitude;
      if (lat == null || lon == null) return null;
      return makeStand({
        id: `fsq-${place.fsq_id}`,
        name: place.name,
        phone: place.tel,
        lat,
        lon,
        origin: position,
        source: "foursquare",
        address:
          place.location?.formatted_address ||
          place.location?.address ||
          null,
      });
    })
    .filter(Boolean);

  return { stands: dedupeStands(stands), provider: "foursquare" };
}

/**
 * Geoapify Places — ücretsiz kota + iyi küresel kapsama.
 */
export async function fetchNearbyStandsGeoapify(
  position,
  { radiusM = NEARBY_RADIUS_M, signal } = {},
) {
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEOAPIFY_API_KEY tanımlı değil.");
  }

  const useProxy = import.meta.env.DEV;
  const url = useProxy
    ? new URL("/api/geoapify/v2/places", window.location.origin)
    : new URL("https://api.geoapify.com/v2/places");

  // service.vehicle.taxi ve isim araması
  url.searchParams.set(
    "categories",
    "service.vehicle.taxi,building.transport.taxi",
  );
  url.searchParams.set(
    "filter",
    `circle:${position.lon},${position.lat},${radiusM}`,
  );
  url.searchParams.set("bias", `proximity:${position.lon},${position.lat}`);
  url.searchParams.set("limit", String(MAX_STANDS));
  url.searchParams.set("lang", "tr");
  if (!useProxy) url.searchParams.set("apiKey", apiKey);

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) {
    throw new Error("Geoapify Places araması başarısız.");
  }

  const data = await response.json();
  const stands = (data.features ?? [])
    .map((feature) => {
      const props = feature.properties ?? {};
      const [lon, lat] = feature.geometry?.coordinates ?? [];
      if (lat == null || lon == null) return null;
      return makeStand({
        id: `geo-${props.place_id || props.osm_id || `${lat}-${lon}`}`,
        name: props.name || props.address_line1 || "Taksi durağı",
        phone: props.contact?.phone || props.datasource?.raw?.phone,
        lat,
        lon,
        origin: position,
        source: "geoapify",
        address: props.formatted || props.address_line2 || null,
      });
    })
    .filter(Boolean);

  return { stands: dedupeStands(stands), provider: "geoapify" };
}

/**
 * Genişletilmiş Overpass: amenity + isimde "taksi/taxi".
 */
export async function fetchNearbyStandsOverpass(
  position,
  { radiusM = NEARBY_RADIUS_M, signal } = {},
) {
  const query = `
    [out:json][timeout:30];
    (
      node["amenity"="taxi"](around:${radiusM},${position.lat},${position.lon});
      way["amenity"="taxi"](around:${radiusM},${position.lat},${position.lon});
      node["amenity"="taxi_office"](around:${radiusM},${position.lat},${position.lon});
      node["office"="taxi"](around:${radiusM},${position.lat},${position.lon});
      node["name"~"[Tt]aksi|[Tt]axi",i](around:${radiusM},${position.lat},${position.lon});
      way["name"~"[Tt]aksi|[Tt]axi",i](around:${radiusM},${position.lat},${position.lon});
      node["shop"="taxi"](around:${radiusM},${position.lat},${position.lon});
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
    throw new Error("Overpass durak araması başarısız.");
  }

  const data = await response.json();
  const stands = (data.elements ?? [])
    .map((element) => {
      const tags = element.tags ?? {};
      const lat = element.lat ?? element.center?.lat;
      const lon = element.lon ?? element.center?.lon;
      if (lat == null || lon == null) return null;
      return makeStand({
        id: `osm-${element.type}-${element.id}`,
        name: tags.name || tags.operator || "Taksi durağı",
        phone: tags.phone || tags["contact:phone"] || tags.mobile,
        lat,
        lon,
        origin: position,
        source: "overpass",
        address: tags["addr:full"] || tags["addr:street"] || null,
      });
    })
    .filter(Boolean);

  return { stands: dedupeStands(stands), provider: "overpass" };
}

/**
 * Nominatim metin araması: "taksi" + şehir / viewbox.
 */
export async function fetchNearbyStandsNominatim(
  position,
  { radiusM = CITY_RADIUS_M, cityName = "", signal } = {},
) {
  const delta = radiusM / 111_320;
  const viewbox = [
    position.lon - delta,
    position.lat + delta,
    position.lon + delta,
    position.lat - delta,
  ].join(",");

  const queries = cityName
    ? [`taksi durağı ${cityName}`, `taksi ${cityName}`, `taxi ${cityName}`]
    : ["taksi durağı", "taksi", "taxi stand"];

  const stands = [];

  for (const q of queries) {
    const params = new URLSearchParams({
      q,
      format: "json",
      addressdetails: "1",
      limit: "12",
      viewbox,
      bounded: "1",
      countrycodes: "tr",
    });

    try {
      const response = await fetch(`${NOMINATIM_SEARCH}?${params}`, {
        signal,
        headers: {
          Accept: "application/json",
          "Accept-Language": "tr",
        },
      });
      if (!response.ok) continue;
      const data = await response.json();
      for (const item of data) {
        const lat = Number(item.lat);
        const lon = Number(item.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        stands.push(
          makeStand({
            id: `nom-${item.place_id}`,
            name: item.name || item.display_name?.split(",")[0] || "Taksi",
            phone: null,
            lat,
            lon,
            origin: position,
            source: "nominatim",
            address: item.display_name || null,
          }),
        );
      }
    } catch {
      /* sorgu atlanır */
    }
  }

  return { stands: dedupeStands(stands), provider: "nominatim" };
}

/**
 * Sağlayıcı zinciri: Google → Foursquare → Geoapify → OSM birleşik.
 * Anahtarlı servisler dolu sonuç verirse onu kullanır.
 */
export async function fetchNearbyTaxiStands(position, options = {}) {
  const configured = getConfiguredStandProviders();
  const errors = [];

  if (configured.google) {
    try {
      const result = await fetchNearbyStandsGoogle(position, options);
      if (result.stands.length > 0) return result;
    } catch (error) {
      errors.push(`Google: ${error.message}`);
    }
  }

  if (configured.foursquare) {
    try {
      const result = await fetchNearbyStandsFoursquare(position, options);
      if (result.stands.length > 0) return result;
    } catch (error) {
      errors.push(`Foursquare: ${error.message}`);
    }
  }

  if (configured.geoapify) {
    try {
      const result = await fetchNearbyStandsGeoapify(position, options);
      if (result.stands.length > 0) return result;
    } catch (error) {
      errors.push(`Geoapify: ${error.message}`);
    }
  }

  const freeResults = await Promise.allSettled([
    fetchNearbyStandsOverpass(position, options),
    fetchNearbyStandsNominatim(position, {
      ...options,
      cityName: options.cityName || "",
    }),
  ]);

  const merged = [];
  const providers = [];
  for (const result of freeResults) {
    if (result.status !== "fulfilled") {
      errors.push(result.reason?.message || "Serbest kaynak hatası");
      continue;
    }
    merged.push(...result.value.stands);
    providers.push(result.value.provider);
  }

  const stands = dedupeStands(merged);
  return {
    stands,
    provider: providers.length ? providers.join("+") : "none",
    warnings: errors,
    needsApiKey: !configured.google && !configured.foursquare && !configured.geoapify,
  };
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
  const result = await fetchNearbyTaxiStands(position, {
    signal,
    radiusM: radiusM ?? CITY_RADIUS_M,
    cityName: province.name,
  });

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
  let needsApiKey = false;
  let searchPosition = position;

  try {
    if (standCityId || !position) {
      const cityResult = await fetchStandsForCity(cityId, { signal });
      stands = cityResult.stands;
      standsProvider = cityResult.provider;
      searchPosition = cityResult.position;
      needsApiKey = Boolean(cityResult.needsApiKey);
    } else {
      const result = await fetchNearbyTaxiStands(position, {
        signal,
        radiusM: NEARBY_RADIUS_M,
      });
      stands = result.stands;
      standsProvider = result.provider;
      needsApiKey = Boolean(result.needsApiKey);
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
    needsApiKey,
    configuredProviders: getConfiguredStandProviders(),
    error: messages.length ? messages.join(" ") : null,
  };
}

export { telHref, normalizePhone, CITY_RADIUS_M, NEARBY_RADIUS_M };
