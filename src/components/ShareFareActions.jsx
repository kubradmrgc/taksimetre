import { useEffect, useState } from "react";
import {
  buildFareShareText,
  copyText,
  shareOrCopy,
  whatsappShareHref,
} from "../lib/shareFare.js";


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

  const secondaryBtn =
    "rounded-xl border border-stone-300/80 bg-white px-3 py-2 text-sm font-medium text-ink transition hover:border-taxi/70 dark:border-white/15 dark:bg-white/5 dark:text-stone-100 dark:hover:border-taxi/60 dark:hover:bg-white/10";

  return (
    <div className="border-t border-stone-200/90 px-5 py-3 dark:border-white/10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        Sonucu paylaş
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={handleCopy} className={secondaryBtn}>
          Kopyala
        </button>
        <a
          href={whatsappShareHref(text)}
          target="_blank"
          rel="noopener noreferrer"
          className={secondaryBtn}
        >
          WhatsApp
        </a>
        {canNativeShare ? (
          <button
            type="button"
            onClick={handleNativeShare}
            className="rounded-xl border border-taxi/60 bg-taxi/20 px-3 py-2 text-sm font-semibold text-taxi-dim transition hover:bg-taxi/30 dark:border-taxi/50 dark:bg-taxi/15 dark:text-taxi dark:hover:bg-taxi/25"
          >
            Paylaş
          </button>
        ) : null}
      </div>
      {status === "copied" ? (
        <p className="mt-2 text-xs text-taxi-dim dark:text-taxi">
          Panoya kopyalandı.
        </p>
      ) : null}
      {status === "shared" ? (
        <p className="mt-2 text-xs text-taxi-dim dark:text-taxi">
          Paylaşım menüsü açıldı.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          Paylaşılamadı. Metni elle kopyalamayı deneyin.
        </p>
      ) : null}
    </div>
  );
}
