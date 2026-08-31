/** İstanbul taksi segmentleri (İBB / UKOME, 20 Temmuz 2026). */
export const ISTANBUL_SEGMENTS = [
  {
    id: "yellow",
    name: "Sarı",
    shortName: "Sarı",
    hint: "Standart",
    openingFee: 71.94,
    perKmFee: 47.92,
    minimumFee: 230,
    perMinuteFee: 9.98,
  },
  {
    id: "turquoise",
    name: "Turkuaz",
    shortName: "Turkuaz",
    hint: "D segment",
    openingFee: 82.73,
    perKmFee: 55.1,
    minimumFee: 265,
    perMinuteFee: 11.48,
  },
  {
    id: "van",
    name: "8+1",
    shortName: "8+1",
    hint: "Geniş",
    openingFee: 93.52,
    perKmFee: 62.69,
    minimumFee: 300,
    perMinuteFee: 12.97,
  },
  {
    id: "black",
    name: "Siyah",
    shortName: "Siyah",
    hint: "VIP",
    openingFee: 122.3,
    perKmFee: 81.46,
    minimumFee: 400,
    perMinuteFee: 16.97,
  },
];

export const DEFAULT_ISTANBUL_SEGMENT_ID = "yellow";

export function getIstanbulSegment(segmentId) {
  return (
    ISTANBUL_SEGMENTS.find((item) => item.id === segmentId) ??
    ISTANBUL_SEGMENTS[0]
  );
}

export function segmentToFormValues(segment) {
  return {
    openingFee: String(segment.openingFee),
    perKmFee: String(segment.perKmFee),
    perMinuteFee: String(segment.perMinuteFee),
    minimumFee: String(segment.minimumFee),
  };
}
