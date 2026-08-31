/**
 * Sık kullanılan havalimanı / otogar noktaları (Nominatim yerine sabit koordinat).
 * cityId: hangi il seçilince gösterileceği.
 */
export const TRAVEL_HUBS = [
  // İstanbul
  {
    id: "ist",
    cityId: "istanbul",
    kind: "airport",
    name: "İstanbul Havalimanı (IST)",
    shortName: "IST",
    lat: 41.275278,
    lon: 28.751944,
  },
  {
    id: "saw",
    cityId: "istanbul",
    kind: "airport",
    name: "Sabiha Gökçen (SAW)",
    shortName: "SAW",
    lat: 40.898333,
    lon: 29.309167,
  },
  {
    id: "istanbul-otogar",
    cityId: "istanbul",
    kind: "otogar",
    name: "Esenler Otogarı",
    shortName: "Otogar",
    lat: 41.040556,
    lon: 28.893333,
  },
  // Ankara
  {
    id: "esb",
    cityId: "ankara",
    kind: "airport",
    name: "Esenboğa Havalimanı (ESB)",
    shortName: "ESB",
    lat: 40.128056,
    lon: 32.995,
  },
  {
    id: "ankara-otogar",
    cityId: "ankara",
    kind: "otogar",
    name: "AŞTİ",
    shortName: "AŞTİ",
    lat: 39.920278,
    lon: 32.813889,
  },
  // İzmir
  {
    id: "adb",
    cityId: "izmir",
    kind: "airport",
    name: "Adnan Menderes (ADB)",
    shortName: "ADB",
    lat: 38.2925,
    lon: 27.156944,
  },
  {
    id: "izmir-otogar",
    cityId: "izmir",
    kind: "otogar",
    name: "İzmir Otogarı",
    shortName: "Otogar",
    lat: 38.4325,
    lon: 27.179722,
  },
  // Antalya
  {
    id: "ayt",
    cityId: "antalya",
    kind: "airport",
    name: "Antalya Havalimanı (AYT)",
    shortName: "AYT",
    lat: 36.898611,
    lon: 30.800556,
  },
  {
    id: "antalya-otogar",
    cityId: "antalya",
    kind: "otogar",
    name: "Antalya Otogarı",
    shortName: "Otogar",
    lat: 36.910278,
    lon: 30.710833,
  },
  // Adana
  {
    id: "ada",
    cityId: "adana",
    kind: "airport",
    name: "Çukurova Havalimanı (COV)",
    shortName: "COV",
    lat: 36.8075,
    lon: 35.783056,
  },
  // Gaziantep
  {
    id: "gzt",
    cityId: "gaziantep",
    kind: "airport",
    name: "Oğuzeli Havalimanı (GZT)",
    shortName: "GZT",
    lat: 36.947222,
    lon: 37.478611,
  },
  // Trabzon
  {
    id: "tzx",
    cityId: "trabzon",
    kind: "airport",
    name: "Trabzon Havalimanı (TZX)",
    shortName: "TZX",
    lat: 40.995278,
    lon: 39.789722,
  },
  // Bursa
  {
    id: "ytu",
    cityId: "bursa",
    kind: "airport",
    name: "Yenişehir Havalimanı (YEI)",
    shortName: "YEI",
    lat: 40.255278,
    lon: 29.5625,
  },
  {
    id: "bursa-otogar",
    cityId: "bursa",
    kind: "otogar",
    name: "Bursa Terminal",
    shortName: "Otogar",
    lat: 40.223056,
    lon: 28.9875,
  },
  // Konya
  {
    id: "kyA",
    cityId: "konya",
    kind: "airport",
    name: "Konya Havalimanı (KYA)",
    shortName: "KYA",
    lat: 37.979,
    lon: 32.5619,
  },
  // Dalaman / Muğla
  {
    id: "dlm",
    cityId: "mugla",
    kind: "airport",
    name: "Dalaman Havalimanı (DLM)",
    shortName: "DLM",
    lat: 36.713056,
    lon: 28.7925,
  },
  {
    id: "bjv",
    cityId: "mugla",
    kind: "airport",
    name: "Bodrum-Milas (BJV)",
    shortName: "BJV",
    lat: 37.250556,
    lon: 27.664444,
  },
  // Samsun
  {
    id: "szf",
    cityId: "samsun",
    kind: "airport",
    name: "Çarşamba Havalimanı (SZF)",
    shortName: "SZF",
    lat: 41.265278,
    lon: 36.553889,
  },
  // Diyarbakır
  {
    id: "diy",
    cityId: "diyarbakir",
    kind: "airport",
    name: "Diyarbakır Havalimanı (DIY)",
    shortName: "DIY",
    lat: 37.893889,
    lon: 40.201111,
  },
  // Erzurum
  {
    id: "erz",
    cityId: "erzurum",
    kind: "airport",
    name: "Erzurum Havalimanı (ERZ)",
    shortName: "ERZ",
    lat: 39.956389,
    lon: 41.170278,
  },
  // Van
  {
    id: "van",
    cityId: "van",
    kind: "airport",
    name: "Van Ferit Melen (VAN)",
    shortName: "VAN",
    lat: 38.468056,
    lon: 43.332222,
  },
  // Kayseri
  {
    id: "asr",
    cityId: "kayseri",
    kind: "airport",
    name: "Erkilet Havalimanı (ASR)",
    shortName: "ASR",
    lat: 38.770278,
    lon: 35.495556,
  },
];

export function hubsForCity(cityId) {
  const id = cityId === "custom" ? "istanbul" : cityId;
  return TRAVEL_HUBS.filter((hub) => hub.cityId === id);
}

export function hubToPlace(hub) {
  return {
    id: `hub-${hub.id}`,
    label: hub.name,
    lat: hub.lat,
    lon: hub.lon,
    kind: hub.kind,
  };
}
