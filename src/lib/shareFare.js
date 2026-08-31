import { formatDecimal, formatLira } from "./formatCurrency.js";


export function buildFareShareText({
  fare,
  cityLabel,
  distanceKm,
  waitingMinutes,
  originLabel,
  destinationLabel,
} = {}) {
  const lines = [`Taksimetre — ${cityLabel || "Türkiye"}`];

  if (originLabel || destinationLabel) {
    const from = originLabel || "Başlangıç";
    const to = destinationLabel || "Varış";
    lines.push(`${from} → ${to}`);
  }

  const bits = [];
  const distance = toShareNumber(distanceKm);
  const waiting = toShareNumber(waitingMinutes);
  if (distance != null && distance > 0) {
    bits.push(`Mesafe: ${formatDecimal(distance)} km`);
  }
  if (waiting != null && waiting > 0) {
    bits.push(`Bekleme: ${formatDecimal(waiting)} dk`);
  }
  if (bits.length) lines.push(bits.join(" · "));

  const tags = [];
  if (fare?.roundTrip) tags.push("gidiş-dönüş");
  if (fare?.appliedMinimum) tags.push("indi-bindi");
  if (fare?.tolls > 0) {
    tags.push(`geçiş ${formatDecimal(fare.tolls)} ₺`);
  }
  if (tags.length) lines.push(`(${tags.join(" · ")})`);

  lines.push(`Tahmini ücret: ${formatLira(fare?.total ?? 0)}`);
  lines.push("Bilgilendirme amaçlıdır; resmi taksimetre esas alınır.");

  return lines.join("\n");
}

function toShareNumber(value) {
  if (value === "" || value == null) return null;
  const parsed = Number(String(value).trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function whatsappShareHref(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export async function copyText(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  document.body.removeChild(area);
}

export async function shareOrCopy(text, { title = "Taksimetre" } = {}) {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text });
      return "shared";
    } catch (err) {
      if (err?.name === "AbortError") return "cancelled";
    }
  }

  await copyText(text);
  return "copied";
}
