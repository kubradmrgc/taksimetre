import { useEffect, useState } from "react";
import {
  buildFareShareText,
  copyText,
  shareOrCopy,
  whatsappShareHref,
} from "../lib/shareFare.js";

/**
 * Ücret sonucunu kopyala / WhatsApp / sistem paylaşımı.
 */
export function ShareFareActions({
  fare,
  cityLabel,
  distanceKm,
  waitingMinutes,
  originLabel,
  destinationLabel,
}) {
  const [status, setStatus] = useState(null);
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const text = buildFareShareText({
    fare,
    cityLabel,
    distanceKm,
    waitingMinutes,
    originLabel,
    destinationLabel,
  });

  useEffect(() => {
    if (!status) return undefined;
    const timer = window.setTimeout(() => setStatus(null), 2200);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function handleCopy() {
    try {
      await copyText(text);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  async function handleNativeShare() {
    try {
      const result = await shareOrCopy(text);
      if (result === "shared") setStatus("shared");
      else if (result === "copied") setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="border-t border-white/10 px-5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        Sonucu paylaş
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-stone-100 transition hover:border-taxi/60 hover:bg-white/10"
        >
          Kopyala
        </button>
        <a
          href={whatsappShareHref(text)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-stone-100 transition hover:border-taxi/60 hover:bg-white/10"
        >
          WhatsApp
        </a>
        {canNativeShare ? (
          <button
            type="button"
            onClick={handleNativeShare}
            className="rounded-xl border border-taxi/50 bg-taxi/15 px-3 py-2 text-sm font-semibold text-taxi transition hover:bg-taxi/25"
          >
            Paylaş
          </button>
        ) : null}
      </div>
      {status === "copied" ? (
        <p className="mt-2 text-xs text-taxi">Panoya kopyalandı.</p>
      ) : null}
      {status === "shared" ? (
        <p className="mt-2 text-xs text-taxi">Paylaşım menüsü açıldı.</p>
      ) : null}
      {status === "error" ? (
        <p className="mt-2 text-xs text-amber-300">
          Paylaşılamadı. Metni elle kopyalamayı deneyin.
        </p>
      ) : null}
    </div>
  );
}
