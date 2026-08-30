import chambersData from "../data/chambersData.json";
import municipalityContacts from "../data/municipalityContacts.json";
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

/** Büyükşehir belediyesi olan iller */
const METROPOLITAN_IDS = new Set([
  "adana",
  "ankara",
  "antalya",
  "aydin",
  "balikesir",
  "bursa",
  "denizli",
  "diyarbakir",
  "erzurum",
  "eskisehir",
  "gaziantep",
  "hatay",
  "istanbul",
  "izmir",
  "kahramanmaras",
  "kayseri",
  "kocaeli",
  "konya",
  "malatya",
  "manisa",
  "mardin",
  "mersin",
  "mugla",
  "ordu",
  "sakarya",
  "samsun",
  "sanliurfa",
  "tekirdag",
  "trabzon",
  "van",
]);

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

/** TR cep → https://wa.me/905XXXXXXXXX */
function whatsappHref(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (!digits) return null;

  let national = digits;
  if (national.startsWith("90") && national.length >= 12) {
    national = national.slice(2);
  }
  if (national.startsWith("0")) {
    national = national.slice(1);
  }
  if (!/^5\d{9}$/.test(national)) return null;
  return `https://wa.me/90${national}`;
}

function normalizeWebsite(url) {
  if (!url) return null;
  const raw = String(url).trim();
  if (!raw || raw === "#" || /^javascript:/i.test(raw)) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[\w.-]+\.[\w.-]+/i.test(raw)) return `https://${raw}`;
  return null;
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
  website = null,
  approximate = false,
  districtId = null,
  districtName = null,
}) {
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);
  const distanceM =
    hasCoords && origin
      ? haversineMeters(origin.lat, origin.lon, lat, lon)
      : null;
  const normalized = normalizePhone(phone);
  return {
    id,
    name: name || "Taksi durağı",
    phone: normalized,
    telHref: telHref(normalized),
    whatsappHref: whatsappHref(normalized),
    website: normalizeWebsite(website),
    approximate: Boolean(approximate) || !hasCoords,
    districtId: districtId || null,
    districtName: districtName || null,
    distanceM,
    distanceLabel: distanceM == null ? null : distanceLabel(distanceM),
    lat: hasCoords ? lat : null,
    lon: hasCoords ? lon : null,
    source,
    address,
  };
}

function dedupeStands(stands, { limit = MAX_STANDS } = {}) {
  const seen = new Set();
  const unique = [];

  for (const stand of stands) {
    const coordKey =
      stand.lat != null && stand.lon != null
        ? `${stand.lat.toFixed(4)}|${stand.lon.toFixed(4)}`
        : `phone:${stand.phone || stand.id}`;
    const key = `${foldTr(stand.name)}|${coordKey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(stand);
  }

  unique.sort((a, b) => {
    // İlçeli / koordinatlı önce
    const aRank = a.approximate ? 1 : 0;
    const bRank = b.approximate ? 1 : 0;
    if (aRank !== bRank) return aRank - bRank;
    const aDist = a.distanceM ?? Number.POSITIVE_INFINITY;
    const bDist = b.distanceM ?? Number.POSITIVE_INFINITY;
    return aDist - bDist;
  });

  return limit == null ? unique : unique.slice(0, limit);
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
 * chambersData'da kaydı olmayan iller için belediye + beyaz masa yedekleri.
 */
export function buildMunicipalFallbackContacts(province) {
  if (!province?.id) return [];

  const isMetro = METROPOLITAN_IDS.has(province.id);
  const org = isMetro
    ? `${province.name} Büyükşehir Belediyesi`
    : `${province.name} Belediyesi`;
  const website =
    municipalityContacts.websites?.[province.id] ||
    `https://www.${province.id}.bel.tr`;
  const switchboard = municipalityContacts.phones?.[province.id] || null;

  return [
    {
      id: `${province.id}-beyaz-masa`,
      name: `${org} Beyaz Masa / ALO 153`,
      role: "Şikayet, talep ve bilgilendirme hattı",
      phone: "153",
      website,
      priority: "complaint",
    },
    {
      id: `${province.id}-belediye`,
      name: org,
      role: "Belediye santral / iletişim",
      phone: switchboard,
      website,
      priority: "complaint",
    },
  ];
}

/**
 * chambersData.json içinden şehir + ulusal şikayet / oda iletişimlerini döner.
 * Kayıt yoksa belediye beyaz masa (153) ve santral yedekleri eklenir.
 */
export function getChamberContacts(cityId) {
  const province = PROVINCES.find((item) => item.id === cityId) ?? null;
  const city = chambersData.cities.find((item) => item.id === cityId);
  let cityContacts = city?.contacts ?? [];
  let usedFallback = false;

  if (cityContacts.length === 0 && province) {
    cityContacts = buildMunicipalFallbackContacts(province);
    usedFallback = true;
  }

  return {
    cityId: city?.id ?? cityId ?? null,
    cityName: city?.name ?? province?.name ?? null,
    disclaimer: chambersData.disclaimer,
    national: chambersData.national,
    contacts: cityContacts,
    usedFallback,
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

async function googlePlaceDetails(placeId, signal) {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  const useProxy = import.meta.env.DEV;
  const detailsUrl = googlePlacesBase("details/json");
  detailsUrl.searchParams.set("place_id", placeId);
  detailsUrl.searchParams.set(
    "fields",
    "formatted_phone_number,international_phone_number,name,website",
  );
  detailsUrl.searchParams.set("language", "tr");
  if (!useProxy) detailsUrl.searchParams.set("key", apiKey);

  const response = await fetch(detailsUrl.toString(), { signal });
  if (!response.ok) return { phone: null, website: null };
  const data = await response.json();
  return {
    phone: normalizePhone(
      data.result?.formatted_phone_number ||
        data.result?.international_phone_number,
    ),
    website: normalizeWebsite(data.result?.website),
  };
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
    let website = null;
    try {
      const details = await googlePlaceDetails(place.place_id, signal);
      phone = details.phone;
      website = details.website;
    } catch {
      /* telefon / web opsiyonel */
    }

    stands.push(
      makeStand({
        id: `ggl-${place.place_id}`,
        name: place.name,
        phone,
        website,
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
  url.searchParams.set("fields", "fsq_id,name,location,tel,distance,website");

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
        website: place.website,
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
        website:
          props.website ||
          props.contact?.website ||
          props.datasource?.raw?.website ||
          null,
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
        website:
          tags.website ||
          tags["contact:website"] ||
          tags["contact:facebook"] ||
          tags["contact:instagram"] ||
          null,
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
 * Yerel rehber senkronu (taksi724 / taksicibul / taksiciler).
 * public/data/stands/{cityId}.json dosyasından okur.
 */
export async function fetchStandsFromLocalDirectory(
  cityId,
  position,
  { signal } = {},
) {
  const response = await fetch(`/data/stands/${cityId}.json`, { signal });
  if (response.status === 404) {
    return { stands: [], provider: "directory", missing: true };
  }
  if (!response.ok) {
    throw new Error(`Yerel durak dosyası okunamadı (${response.status}).`);
  }

  const data = await response.json();
  const stands = (data.stands ?? [])
    .map((stand, index) => {
      const lat = Number(stand.lat);
      const lon = Number(stand.lon);
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);
      // İlçesiz ve koordinatsız (eski il merkezi placeholder) kayıtları atla
      if (!hasCoords && !stand.districtId) return null;
      return makeStand({
        id: stand.id || `dir-${cityId}-${index}`,
        name: stand.name,
        phone: stand.phone,
        website: stand.website,
        lat: hasCoords ? lat : null,
        lon: hasCoords ? lon : null,
        origin: position,
        source: (stand.sources || ["directory"]).join("+"),
        address: stand.address,
        approximate: Boolean(stand.approximate) || !hasCoords,
        districtId: stand.districtId,
        districtName: stand.districtName,
      });
    })
    .filter(Boolean);

  return {
    stands: dedupeStands(stands, { limit: null }),
    districts: data.districts ?? [],
    provider: "directory",
    sourceUrls: data.sources,
    cityName: data.cityName,
    fetchedAt: data.fetchedAt,
  };
}

/**
 * Sağlayıcı zinciri:
 * 1) Yerel rehber (taksi724/taksicibul/taksiciler senkronu)
 * 2) Google → Foursquare → Geoapify
 * 3) OSM (Overpass + Nominatim)
 */
export async function fetchNearbyTaxiStands(position, options = {}) {
  const { cityId = null, signal } = options;
  const configured = getConfiguredStandProviders();
  const errors = [];

  if (cityId) {
    try {
      const local = await fetchStandsFromLocalDirectory(cityId, position, {
        signal,
      });
      if (local.stands.length > 0) {
        return local;
      }
      if (local.missing) {
        errors.push(
          "Yerel durak dosyası yok; npm run sync:stands çalıştırın.",
        );
      }
    } catch (error) {
      errors.push(`Rehber: ${error.message}`);
    }
  }

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
    needsApiKey:
      !configured.google && !configured.foursquare && !configured.geoapify,
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
    cityId: province.id,
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
  let districts = [];
  let standsProvider = null;
  let standsError = null;
  let needsApiKey = false;
  let searchPosition = position;

  try {
    if (standCityId || !position) {
      const cityResult = await fetchStandsForCity(cityId, { signal });
      stands = cityResult.stands;
      districts = cityResult.districts ?? [];
      standsProvider = cityResult.provider;
      searchPosition = cityResult.position;
      needsApiKey = Boolean(cityResult.needsApiKey);
    } else {
      const result = await fetchNearbyTaxiStands(position, {
        signal,
        radiusM: NEARBY_RADIUS_M,
        cityId:
          detectedCity.cityId || preferredCityId || standCityId || null,
      });
      stands = result.stands;
      districts = result.districts ?? [];
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
    districts,
    standsProvider,
    needsApiKey,
    configuredProviders: getConfiguredStandProviders(),
    error: messages.length ? messages.join(" ") : null,
  };
}

export { telHref, normalizePhone, CITY_RADIUS_M, NEARBY_RADIUS_M };
