/**
 * Türkiye taksi durağı senkronu.
 * Kaynaklar (HTML scrape, Node tarafı — tarayıcı CORS'a takılmaz):
 * - https://taksi724.com/{il} ve /{il}/{ilce}  (ad, telefon, koordinat)
 * - https://www.taksicibul.com/sehir/{il}     (ad, telefon)
 * - https://taksiciler.com/{il}-taksi-duragi  (ad, telefon)
 * - https://www.nerede360.com/sektor-taksi-duraklari-{il} (+ firma sayfaları)
 *
 * Çıktı: public/data/stands/{cityId}.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PROVINCES_PATH = path.join(ROOT, "src", "lib", "provinces.js");
const OUT_DIR = path.join(ROOT, "public", "data", "stands");

const HEADERS = {
  "User-Agent":
    "taksimetre-stands-sync/1.0 (+local research; respectful crawl)",
  "Accept-Language": "tr",
  Accept: "text/html,application/xhtml+xml",
};

const FETCH_GAP_MS = 180;
const optional = process.argv.includes("--optional");
const onlyCity = process.argv
  .find((arg) => arg.startsWith("--city="))
  ?.slice("--city=".length);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripTags(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

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

function slugifyDistrict(value) {
  return foldTr(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** "golbasi" → "Gölbaşı"; bilinen TR kalıpları */
function districtNameFromSlug(slug) {
  if (!slug) return null;
  const special = {
    merkez: "Merkez",
    celikhan: "Çelikhan",
    golbasi: "Gölbaşı",
    sanliurfa: "Şanlıurfa",
    kahramanmaras: "Kahramanmaraş",
    afyonkarahisar: "Afyonkarahisar",
    "ust-kaynarca": "Üst Kaynarca",
    "caddebostan": "Caddebostan",
    sisli: "Şişli",
    uskudar: "Üsküdar",
    umraniye: "Ümraniye",
    bakirkoy: "Bakırköy",
    buyukcekmece: "Büyükçekmece",
    kucukcekmece: "Küçükçekmece",
    gaziosmanpasa: "Gaziosmanpaşa",
    bahcelievler: "Bahçelievler",
    bagcilar: "Bağcılar",
    basaksehir: "Başakşehir",
    beyoglu: "Beyoğlu",
    cekmekoy: "Çekmeköy",
    sultanbeyli: "Sultanbeyli",
    sile: "Şile",
    cigli: "Çiğli",
    bornova: "Bornova",
    konak: "Konak",
    karsiyaka: "Karşıyaka",
  };
  if (special[slug]) return special[slug];
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr") + part.slice(1))
    .join(" ");
}

function normalizeDistrictLabel(label, cityName) {
  if (!label) return null;
  let name = stripTags(label).replace(/\s+/g, " ").trim();
  if (!name) return null;
  const cityFold = foldTr(cityName);
  // "Adıyaman Merkez" → id adiyaman-merkez; UI'da "Merkez" de kabul
  if (foldTr(name) === `${cityFold} merkez`) {
    return { id: "merkez", name: "Merkez" };
  }
  if (foldTr(name) === "merkez") {
    return { id: "merkez", name: "Merkez" };
  }
  const id = slugifyDistrict(name);
  return id ? { id, name } : null;
}

function normalizePhone(phone) {
  if (!phone) return null;
  let digits = String(phone).replace(/[^\d]/g, "");
  if (digits.startsWith("90") && digits.length >= 12) {
    digits = `0${digits.slice(2)}`;
  }
  if (digits.length === 10 && digits.startsWith("5")) {
    digits = `0${digits}`;
  }
  return digits.length >= 10 ? digits : digits.length >= 3 ? digits : null;
}

function loadProvinces() {
  const source = fs.readFileSync(PROVINCES_PATH, "utf8");
  const matches = [
    ...source.matchAll(
      /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*shortName:\s*"([^"]+)",\s*plate:\s*"([^"]+)",\s*lat:\s*([\d.]+),\s*lon:\s*([\d.]+)/g,
    ),
  ];
  return matches.map((match) => ({
    id: match[1],
    name: match[2],
    shortName: match[3],
    plate: match[4],
    lat: Number(match[5]),
    lon: Number(match[6]),
  }));
}

async function fetchText(url) {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`${url} → HTTP ${response.status}`);
  }
  return response.text();
}

function parseTaksi724District(html, district = null) {
  const parts = html.split(/(?=https:\/\/www\.google\.com\/maps\?q=)/);
  const stands = [];

  for (const part of parts) {
    const coords = part.match(/maps\?q=([\d.\-]+),([\d.\-]+)/);
    if (!coords) continue;

    const lat = Number(coords[1]);
    const lon = Number(coords[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const telMatch = part.match(/href="tel:([^"]+)"/);
    const phone = normalizePhone(telMatch?.[1]);

    const plain = stripTags(part);
    let name = "Taksi durağı";
    const nameCandidates = [
      ...plain.matchAll(
        /\b([A-Za-zĞÜŞİÖÇğüşıöç0-9 .'\-/]{2,40}Taksi(?:\s*Durağı)?)\b/gi,
      ),
    ].map((m) => m[1].trim());

    const cleaned = nameCandidates
      .map((candidate) =>
        candidate
          .replace(/^.*?\bDetay\s+/i, "")
          .replace(/^.*?\btelefon(?:\s*var)?\s+/i, "")
          .replace(/^.*?\bkonum(?:\s*var)?\s+/i, "")
          .replace(/\b\d{10,11}\b/g, "")
          .replace(/\s+/g, " ")
          .trim(),
      )
      .filter(
        (candidate) =>
          candidate.length >= 4 &&
          /taksi/i.test(candidate) &&
          !/^(detay|telefon|konum)/i.test(candidate),
      );

    if (cleaned.length > 0) {
      name = cleaned[cleaned.length - 1];
    }

    const addrMatch = part.match(/line-clamp-2">([^<]+)</);

    stands.push({
      name,
      phone,
      lat,
      lon,
      address: addrMatch ? stripTags(addrMatch[1]) : null,
      districtId: district?.id ?? null,
      districtName: district?.name ?? null,
      source: "taksi724",
    });
  }

  return stands;
}

function collectDistrictPaths(cityHtml, citySlug) {
  const re = new RegExp(`href="(/${citySlug}/[a-z0-9-]+)"`, "gi");
  const paths = new Set();
  for (const match of cityHtml.matchAll(re)) {
    const p = match[1];
    if (p.includes("taksi-ucreti") || p.includes("otogar")) continue;
    paths.add(p);
  }
  return [...paths];
}

async function scrapeTaksi724(city) {
  const cityUrl = `https://taksi724.com/${city.id}`;
  let cityHtml;
  try {
    cityHtml = await fetchText(cityUrl);
  } catch (error) {
    console.warn(`  taksi724 city fail (${city.id}): ${error.message}`);
    return [];
  }

  const districts = collectDistrictPaths(cityHtml, city.id);
  const stands = [];

  // Şehir sayfasındaki kartlar → Merkez varsayımı yok; ilçe yok
  stands.push(...parseTaksi724District(cityHtml, null));

  for (const districtPath of districts) {
    await sleep(FETCH_GAP_MS);
    const slug = districtPath.split("/").pop();
    const district = {
      id: slug === "merkez" ? "merkez" : slug,
      name: districtNameFromSlug(slug),
    };
    try {
      const html = await fetchText(`https://taksi724.com${districtPath}`);
      stands.push(...parseTaksi724District(html, district));
    } catch (error) {
      console.warn(`  taksi724 ${districtPath}: ${error.message}`);
    }
  }

  return stands;
}

function parseNamePhoneList(html, source) {
  const stands = [];
  const patterns = [
    new RegExp(
      "<h3[^>]*>[\\s\\S]*?<a[^>]*>([\\s\\S]*?)</a>[\\s\\S]{0,900}?href=\"tel:([^\"]+)\"",
      "gi",
    ),
    new RegExp(
      "href=\"tel:([^\"]+)\"[\\s\\S]{0,200}?>([0-9\\s]+)</(?:span|a|div|p)>",
      "gi",
    ),
  ];

  const seen = new Set();

  for (const re of patterns) {
    for (const match of html.matchAll(re)) {
      let name;
      let phone;

      // First pattern: name, phone — second: phone, display
      if (match[0].includes("<h3")) {
        name = stripTags(match[1]);
        phone = normalizePhone(match[2]);
      } else {
        phone = normalizePhone(match[1]);
        name = "Taksi durağı";
      }

      if (!phone || seen.has(phone)) continue;
      seen.add(phone);
      if (!name || name.length < 3) name = "Taksi durağı";
      if (/^(Merkez|Ara|Detay|Telefon|İlçe|Şehir|\d)/i.test(name)) {
        name = "Taksi durağı";
      }

      stands.push({
        name: name.slice(0, 80),
        phone,
        lat: null,
        lon: null,
        address: null,
        source,
      });
    }
  }

  // Son çare: sadece tel: linkleri
  if (stands.length === 0) {
    for (const match of html.matchAll(/href="tel:([^"]+)"/gi)) {
      const phone = normalizePhone(match[1]);
      if (!phone || seen.has(phone)) continue;
      seen.add(phone);
      stands.push({
        name: "Taksi durağı",
        phone,
        lat: null,
        lon: null,
        address: null,
        source,
      });
    }
  }

  return stands;
}

async function scrapeTaksicibul(city) {
  const url = `https://www.taksicibul.com/sehir/${city.id}`;
  try {
    const html = await fetchText(url);
    return parseNamePhoneList(html, "taksicibul");
  } catch (error) {
    console.warn(`  taksicibul fail (${city.id}): ${error.message}`);
    return [];
  }
}

async function scrapeTaksiciler(city) {
  const url = `https://taksiciler.com/${city.id}-taksi-duragi`;
  try {
    const html = await fetchText(url);
    return parseNamePhoneList(html, "taksiciler");
  } catch (error) {
    console.warn(`  taksiciler fail (${city.id}): ${error.message}`);
    return [];
  }
}

function parseNerede360Listing(html, cityName) {
  const chunks = html.split(/(?=href="(?:https:\/\/www\.nerede360\.com\/)?firma-(?!bul|giris|ekle))/i);
  const seen = new Set();
  const firms = [];

  for (const chunk of chunks) {
    const hrefMatch = chunk.match(
      /^href="((?:https:\/\/www\.nerede360\.com\/)?firma-(?!bul|giris|ekle)[^"]+)"/i,
    );
    if (!hrefMatch) continue;

    const slug = hrefMatch[1].replace(/^https:\/\/www\.nerede360\.com\//, "");
    const url = `https://www.nerede360.com/${slug}`;
    if (seen.has(url)) continue;
    seen.add(url);

    const name =
      stripTags(chunk.match(/alt="([^"]+)"/i)?.[1] || "") ||
      stripTags(chunk.match(/firmabaslikkutu[^>]*>([\s\S]*?)<\//i)?.[1] || "") ||
      "Taksi durağı";
    const districtLabel =
      stripTags(chunk.match(/ilceadihover[^>]*>([\s\S]*?)<\//i)?.[1] || "") ||
      null;
    const district = normalizeDistrictLabel(districtLabel, cityName);

    firms.push({
      url,
      name: name.replace(/\s+/g, " ").trim().slice(0, 80),
      districtId: district?.id ?? null,
      districtName: district?.name ?? null,
    });
  }

  return firms;
}

function parseNerede360Firm(html, fallback) {
  const telMatch =
    html.match(/href="tel:([^"]+)"/i) ||
    html.match(/(?:Tel|Telefon)[^0-9]{0,20}(0?5\d{9}|\d{10,11})/i);
  const phone = normalizePhone(telMatch?.[1]);
  if (!phone) return null;

  const title =
    stripTags(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "") ||
    fallback?.name ||
    "Taksi durağı";

  let districtId = fallback?.districtId ?? null;
  let districtName = fallback?.districtName ?? null;

  if (!districtId) {
    const locality =
      html.match(/"addressLocality"\s*:\s*"([^"]+)"/i)?.[1] ||
      title.match(/\(([^/)]+)\//)?.[1];
    const district = normalizeDistrictLabel(locality, fallback?.cityName);
    districtId = district?.id ?? null;
    districtName = district?.name ?? null;
  }

  const social = [
    ...html.matchAll(
      /href="(https:\/\/(?:www\.)?(?:instagram|facebook)\.com\/[^"]+)"/gi,
    ),
  ]
    .map((match) => match[1])
    .filter((url) => !/nerede360/i.test(url));

  const siteMatch =
    html.match(
      /(?:Web\s*Sitesi|Website|web\s*adresi)[^<]{0,40}<a[^>]+href="(https?:\/\/[^"]+)"/i,
    ) ||
    html.match(
      /href="(https?:\/\/(?!(?:www\.)?(?:nerede360|facebook|instagram|twitter|x|google|youtube)\.)[^"]+)"[^>]*>\s*(?:Web|Site|www)/i,
    );

  const website = siteMatch?.[1] || social[0] || null;

  return {
    name: title.slice(0, 80),
    phone,
    website,
    districtId,
    districtName,
    source: "nerede360",
  };
}

async function scrapeNerede360(city) {
  const listUrl = `https://www.nerede360.com/sektor-taksi-duraklari-${city.id}`;
  try {
    const listHtml = await fetchText(listUrl);
    const firms = parseNerede360Listing(listHtml, city.name);
    const stands = [];

    for (const firm of firms.slice(0, 40)) {
      await sleep(FETCH_GAP_MS);
      try {
        const firmHtml = await fetchText(firm.url);
        const stand = parseNerede360Firm(firmHtml, {
          name: firm.name,
          districtId: firm.districtId,
          districtName: firm.districtName,
          cityName: city.name,
        });
        if (stand) stands.push(stand);
      } catch (error) {
        console.warn(`  nerede360 firma fail: ${error.message}`);
      }
    }

    return stands;
  } catch (error) {
    console.warn(`  nerede360 fail (${city.id}): ${error.message}`);
    return [];
  }
}

function mergeStands(primary, extras, cityCenter) {
  const byPhone = new Map();
  const result = [];

  function keyOf(stand) {
    if (stand.phone) return `p:${stand.phone}`;
    return `g:${stand.lat?.toFixed(4)},${stand.lon?.toFixed(4)},${foldTr(stand.name)}`;
  }

  function absorb(existing, stand) {
    if (
      (!existing.name || existing.name === "Taksi durağı") &&
      stand.name
    ) {
      existing.name = stand.name;
    }
    if (!existing.address && stand.address) {
      existing.address = stand.address;
    }
    if (!existing.website && stand.website) {
      existing.website = stand.website;
    }
    if (!existing.districtId && stand.districtId) {
      existing.districtId = stand.districtId;
      existing.districtName = stand.districtName;
    }
    existing.sources = [
      ...new Set([...(existing.sources || [existing.source]), stand.source]),
    ];
  }

  for (const stand of primary) {
    const key = keyOf(stand);
    byPhone.set(key, { ...stand });
    result.push(byPhone.get(key));
  }

  for (const stand of extras) {
    if (!stand.phone) continue;
    const key = `p:${stand.phone}`;
    if (byPhone.has(key)) {
      absorb(byPhone.get(key), stand);
      continue;
    }

    // Koordinatsız kayıt: ilçe varsa ilçe bazlı listelenir (il merkezi yok)
    const entry = {
      ...stand,
      lat: stand.lat ?? null,
      lon: stand.lon ?? null,
      approximate: stand.lat == null || stand.lon == null,
      sources: [stand.source],
    };
    // Eski uyumluluk: ilçesiz koordinatsız → il merkezi (filtre dışı kalır)
    if (entry.approximate && !entry.districtId) {
      entry.lat = cityCenter.lat;
      entry.lon = cityCenter.lon;
    }
    byPhone.set(key, entry);
    result.push(entry);
  }

  return result.map((stand, index) => ({
    id: `${stand.source || "dir"}-${stand.phone || index}-${index}`,
    name: stand.name || "Taksi durağı",
    phone: stand.phone,
    website: stand.website || null,
    lat: stand.lat,
    lon: stand.lon,
    address: stand.address || null,
    districtId: stand.districtId || null,
    districtName: stand.districtName || null,
    approximate: Boolean(stand.approximate),
    sources: stand.sources || [stand.source],
  }));
}

function collectDistricts(stands) {
  const byId = new Map();
  for (const stand of stands) {
    if (!stand.districtId || !stand.districtName) continue;
    if (!byId.has(stand.districtId)) {
      byId.set(stand.districtId, {
        id: stand.districtId,
        name: stand.districtName,
        count: 0,
      });
    }
    byId.get(stand.districtId).count += 1;
  }
  return [...byId.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "tr"),
  );
}

async function syncCity(city) {
  console.log(`→ ${city.name}`);
  const from724 = await scrapeTaksi724(city);
  await sleep(FETCH_GAP_MS);
  const fromCibul = await scrapeTaksicibul(city);
  await sleep(FETCH_GAP_MS);
  const fromCiler = await scrapeTaksiciler(city);
  await sleep(FETCH_GAP_MS);
  const fromN360 = await scrapeNerede360(city);

  const merged = mergeStands(
    from724,
    [...fromCibul, ...fromCiler, ...fromN360],
    { lat: city.lat, lon: city.lon },
  );
  const districts = collectDistricts(merged);

  const payload = {
    cityId: city.id,
    cityName: city.name,
    fetchedAt: new Date().toISOString(),
    sources: [
      "https://taksi724.com/",
      "https://www.taksicibul.com/",
      "https://taksiciler.com/",
      "https://www.nerede360.com/",
    ],
    districts,
    count: merged.length,
    stands: merged,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, `${city.id}.json`);
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(
    `  ${merged.length} durak / ${districts.length} ilçe (724:${from724.length}, cibul:${fromCibul.length}, ciler:${fromCiler.length}, n360:${fromN360.length})`,
  );
  return payload.count;
}

async function main() {
  const provinces = loadProvinces();
  const list = onlyCity
    ? provinces.filter((city) => city.id === onlyCity)
    : provinces;

  if (list.length === 0) {
    throw new Error(`Şehir bulunamadı: ${onlyCity}`);
  }

  let total = 0;
  let ok = 0;

  for (const city of list) {
    try {
      total += await syncCity(city);
      ok += 1;
    } catch (error) {
      console.error(`  HATA ${city.id}: ${error.message}`);
      if (!optional) throw error;
    }
    await sleep(FETCH_GAP_MS);
  }

  console.log(`Tamam: ${ok}/${list.length} il, ${total} durak → public/data/stands/`);
}

main().catch((error) => {
  console.error(`Durak senkronu başarısız: ${error.message}`);
  if (optional) process.exit(0);
  process.exit(1);
});
