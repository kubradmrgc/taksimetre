/**
 * 81 il taksimetre tarifesini kamu HTML tablolarından çekip
 * src/data/tariffs.json yazar. Ağ veya parse kırılırsa mevcut JSON'a dokunmaz.
 *
 * Kaynaklar:
 * - Hemen Hesap (CC BY 4.0): 75 il tablosu
 * - taksicilerodasi.com: 10 il (daha güncel İstanbul vb. üzerine yazılır)
 * - taksi724.com: Hemen Hesap'ta olmayan 6 il
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "src", "data", "tariffs.json");
const PROVINCES_PATH = path.join(ROOT, "src", "lib", "provinces.js");

const HEMEN_TABLE_URL =
  "https://www.hemenhesap.com/arastirma/iller-arasi-taksi-ucretleri-2026";
const ODASI_TABLE_URL = "https://taksicilerodasi.com/tr/ucret-hesapla/";
const ODASI_CITY_URL = (slug) =>
  `https://taksicilerodasi.com/tr/ucret-hesapla/${slug}/`;
const TAKSI724_CITY_URL = (slug) => `https://taksi724.com/${slug}`;

const HEADERS = {
  "User-Agent":
    "taksimetre-sync/1.0 (tariff research; +https://taksicilerodasi.com)",
  "Accept-Language": "tr",
  Accept: "text/html,application/xhtml+xml",
};

const EXPECTED_CITY_COUNT = 81;
const MIN_HEMEN_CITIES = 70;
const FETCH_GAP_MS = 160;

const optional = process.argv.includes("--optional");
const fetchNotes = !optional || process.argv.includes("--notes");

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

function parseTrNumber(value) {
  const cleaned = stripTags(value)
    .replace(/[₺]|TL/gi, "")
    .replace(/\s/g, "")
    .trim();

  if (!cleaned) return null;

  let normalized = cleaned;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    normalized = cleaned.replace(",", ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchText(url) {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`${url} → HTTP ${response.status}`);
  }
  return response.text();
}

function loadProvinces() {
  const source = fs.readFileSync(PROVINCES_PATH, "utf8");
  const matches = [
    ...source.matchAll(
      /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*shortName:\s*"([^"]+)"/g,
    ),
  ];

  if (matches.length !== EXPECTED_CITY_COUNT) {
    throw new Error(
      `provinces.js içinde ${matches.length} il var; ${EXPECTED_CITY_COUNT} bekleniyordu.`,
    );
  }

  return matches.map((match) => ({
    id: match[1],
    name: match[2],
    shortName: match[3],
  }));
}

function findProvince(provinces, nameOrSlug) {
  const folded = foldTr(nameOrSlug);
  return (
    provinces.find((city) => city.id === folded) ??
    provinces.find((city) => foldTr(city.name) === folded) ??
    provinces.find((city) => foldTr(city.name).startsWith(folded)) ??
    null
  );
}

function extractTable(html) {
  const table = html.match(/<table[\s\S]*?<\/table>/i)?.[0];
  if (!table) {
    throw new Error("HTML içinde tablo bulunamadı.");
  }
  return table;
}

function parseHemenTable(html, provinces) {
  const rows = [...extractTable(html).matchAll(/<tr[\s\S]*?<\/tr>/gi)].slice(1);
  const cities = [];

  for (const row of rows) {
    const cells = [...row[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(
      (cell) => stripTags(cell[1]),
    );
    if (cells.length < 4) continue;

    const province = findProvince(provinces, cells[0]);
    const openingFee = parseTrNumber(cells[1]);
    const perKmFee = parseTrNumber(cells[2]);
    const minimumFee = parseTrNumber(cells[3]);

    if (!province || openingFee == null || perKmFee == null || minimumFee == null) {
      continue;
    }

    cities.push({
      id: province.id,
      name: province.name,
      shortName: province.shortName,
      openingFee,
      perKmFee,
      minimumFee,
      perMinuteFee: null,
      note: "Hemen Hesap il tarifesi (CC BY 4.0)",
      source: "hemenhesap",
      sourceUrl: `https://www.hemenhesap.com/hesap/taksi/${province.id}`,
    });
  }

  if (cities.length < MIN_HEMEN_CITIES) {
    throw new Error(
      `Hemen Hesap tablosundan yalnızca ${cities.length} il okundu (min ${MIN_HEMEN_CITIES}).`,
    );
  }

  return cities;
}

function parseOdasiTable(html, provinces) {
  const rows = [...extractTable(html).matchAll(/<tr[\s\S]*?<\/tr>/gi)].slice(1);
  const cities = [];

  for (const row of rows) {
    const href = row[0].match(/\/tr\/ucret-hesapla\/([a-z0-9-]+)\//i)?.[1];
    if (!href || /^\d/.test(href)) continue;

    const cells = [...row[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(
      (cell) => stripTags(cell[1]),
    );
    const label = cells[0]?.replace(/\s*taksi ücreti hesaplama$/i, "").trim();
    const province = findProvince(provinces, href) ?? findProvince(provinces, label);
    const openingFee = parseTrNumber(cells[1]);
    const perKmFee = parseTrNumber(cells[2]);
    const minimumFee = parseTrNumber(cells[3]);

    if (!province || openingFee == null || perKmFee == null || minimumFee == null) {
      continue;
    }

    cities.push({
      id: province.id,
      name: province.name,
      shortName: province.shortName,
      openingFee,
      perKmFee,
      minimumFee,
      perMinuteFee: null,
      note: "taksicilerodasi.com bilgilendirme tarifesi",
      source: "taksicilerodasi",
      sourceUrl: ODASI_CITY_URL(href),
    });
  }

  if (cities.length < 8) {
    throw new Error(
      `taksicilerodasi tablosundan yalnızca ${cities.length} il okundu.`,
    );
  }

  return cities;
}

function cleanNotePart(value) {
  return stripTags(value)
    .replace(/\s*[—–-]\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseOdasiNote(html) {
  const source = cleanNotePart(
    html.match(/Tarife kaynağı:\s*([\s\S]*?)(?:Yürürlük|Son kontrol|<form|<style)/i)?.[1],
  );
  const effective = cleanNotePart(html.match(/Yürürlük:\s*([^<]+)/i)?.[1]);
  const checked = cleanNotePart(
    html.match(/Son kontrol:\s*(?:<time[^>]*>)?([^<]+)/i)?.[1],
  );

  const parts = [
    source,
    effective && `Yürürlük ${effective}`,
    checked && `Son kontrol ${checked}`,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : null;
}

function parseTaksi724Fees(html) {
  const text = stripTags(html);
  const match = text.match(
    /Açılış\s+([\d.,]+)\s*TL\s*[·•]\s*km başı\s+([\d.,]+)\s*TL\s*[·•]\s*minimum\s+([\d.,]+)\s*TL/i,
  );

  if (!match) return null;

  const openingFee = parseTrNumber(match[1]);
  const perKmFee = parseTrNumber(match[2]);
  const minimumFee = parseTrNumber(match[3]);

  if (openingFee == null || perKmFee == null || minimumFee == null) return null;

  return { openingFee, perKmFee, minimumFee };
}

function readPreviousCities() {
  if (!fs.existsSync(OUTPUT)) return [];
  try {
    const previous = JSON.parse(fs.readFileSync(OUTPUT, "utf8"));
    return Array.isArray(previous.cities) ? previous.cities : [];
  } catch {
    return [];
  }
}

async function attachOdasiNotes(cities) {
  const odasiCities = cities.filter((city) => city.source === "taksicilerodasi");

  for (const city of odasiCities) {
    await sleep(FETCH_GAP_MS);
    try {
      const html = await fetchText(city.sourceUrl);
      const note = parseOdasiNote(html);
      if (note) city.note = note;
    } catch (error) {
      console.warn(`Not alınamadı (${city.id}): ${error.message}`);
    }
  }
}

async function fillMissingCities(provinces, byId, previousById) {
  const missing = provinces.filter((city) => !byId.has(city.id));

  for (const province of missing) {
    await sleep(FETCH_GAP_MS);
    try {
      const html = await fetchText(TAKSI724_CITY_URL(province.id));
      const fees = parseTaksi724Fees(html);
      if (!fees) {
        throw new Error("tarife metni eşleşmedi");
      }

      byId.set(province.id, {
        id: province.id,
        name: province.name,
        shortName: province.shortName,
        ...fees,
        perMinuteFee: null,
        note: "taksi724.com il sayfası (Hemen Hesap tablosunda yok)",
        source: "taksi724",
        sourceUrl: TAKSI724_CITY_URL(province.id),
      });
    } catch (error) {
      const fallback = previousById.get(province.id);
      if (fallback) {
        console.warn(
          `${province.name} canlı alınamadı (${error.message}); önceki JSON korundu.`,
        );
        byId.set(province.id, fallback);
        continue;
      }
      throw new Error(`${province.name} tamamlanamadı: ${error.message}`);
    }
  }
}

async function sync() {
  const provinces = loadProvinces();
  const previousById = new Map(readPreviousCities().map((city) => [city.id, city]));

  console.log("Hemen Hesap tablosu çekiliyor…");
  const hemenHtml = await fetchText(HEMEN_TABLE_URL);
  const hemenCities = parseHemenTable(hemenHtml, provinces);
  console.log(`  ${hemenCities.length} il`);

  console.log("taksicilerodasi tablosu çekiliyor…");
  const odasiHtml = await fetchText(ODASI_TABLE_URL);
  const odasiCities = parseOdasiTable(odasiHtml, provinces);
  console.log(`  ${odasiCities.length} il (üzerine yazılacak)`);

  const byId = new Map();
  for (const city of hemenCities) byId.set(city.id, city);
  for (const city of odasiCities) byId.set(city.id, city);

  if (fetchNotes) {
    console.log("taksicilerodasi şehir notları çekiliyor…");
    await attachOdasiNotes([...byId.values()]);
  } else {
    for (const city of byId.values()) {
      const previous = previousById.get(city.id);
      if (
        previous?.note &&
        previous.source === city.source &&
        previous.note.length > city.note.length
      ) {
        city.note = previous.note;
      }
    }
  }

  console.log("Eksik iller tamamlanıyor…");
  await fillMissingCities(provinces, byId, previousById);

  const cities = provinces.map((province) => {
    const city = byId.get(province.id);
    if (!city) {
      throw new Error(`${province.name} tarifesi eksik; JSON yazılmadı.`);
    }
    return {
      id: city.id,
      name: province.name,
      shortName: province.shortName,
      openingFee: city.openingFee,
      perKmFee: city.perKmFee,
      minimumFee: city.minimumFee,
      perMinuteFee: city.perMinuteFee ?? null,
      note: city.note,
      source: city.source,
      sourceUrl: city.sourceUrl,
    };
  });

  if (cities.length !== EXPECTED_CITY_COUNT) {
    throw new Error(`${cities.length} il üretildi; ${EXPECTED_CITY_COUNT} bekleniyordu.`);
  }

  const istanbul = cities.find((city) => city.id === "istanbul");
  const sample = Number(
    (istanbul.openingFee + 10 * istanbul.perKmFee).toFixed(2),
  );
  if (istanbul.openingFee < 50 || istanbul.perKmFee < 30) {
    throw new Error(
      `İstanbul tarifesi şüpheli: ${istanbul.openingFee} / ${istanbul.perKmFee}`,
    );
  }

  const payload = {
    source: HEMEN_TABLE_URL,
    sources: [
      {
        id: "hemenhesap",
        url: HEMEN_TABLE_URL,
        license: "CC BY 4.0",
        role: "75 il taban veri",
      },
      {
        id: "taksicilerodasi",
        url: ODASI_TABLE_URL,
        license: null,
        role: "10 il üzerine yazma (İstanbul vb.)",
      },
      {
        id: "taksi724",
        url: "https://taksi724.com/taksi-ucreti-hesapla",
        license: null,
        role: "Hemen Hesap'ta olmayan 6 il",
      },
    ],
    fetchedAt: new Date().toISOString(),
    disclaimer:
      "Resmi kurum değildir; tarifeler bilgilendirme amaçlıdır. Belediye / UKOME kararı değişebilir.",
    cities,
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(`Yazıldı: ${path.relative(ROOT, OUTPUT)}`);
  console.log(
    `İstanbul 10 km (indi-bindi hariç): ${istanbul.openingFee} + 10×${istanbul.perKmFee} = ${sample}`,
  );
}

sync().catch((error) => {
  console.error(`Tarife senkronu başarısız: ${error.message}`);
  if (optional && fs.existsSync(OUTPUT)) {
    console.warn("Mevcut src/data/tariffs.json ile devam ediliyor.");
    process.exit(0);
  }
  process.exit(1);
});
