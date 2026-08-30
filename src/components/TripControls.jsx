export function TripControls({ status, onStart, onEnd, onReset, disabled }) {
  const isLive = status === "locating" || status === "active";
  const isEnded = status === "ended";

  return (
    <div className="flex flex-wrap gap-2">
      {!isLive ? (
        <button
          type="button"
          onClick={onStart}
          disabled={disabled}
          className="inline-flex flex-1 items-center justify-center rounded-2xl bg-taxi px-4 py-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-taxi/90 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:min-w-44"
        >
          Yolculuğu Başlat
        </button>
      ) : (
        <button
          type="button"
          onClick={onEnd}
          className="inline-flex flex-1 items-center justify-center rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-400 sm:flex-none sm:min-w-44"
        >
          Yolculuğu Bitir
        </button>
      )}

      {isEnded || isLive ? (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center rounded-2xl border border-stone-300/80 bg-white px-4 py-3 text-sm font-medium text-ink transition hover:border-taxi dark:border-white/10 dark:bg-white/5 dark:text-stone-100 dark:hover:border-taxi/50"
        >
          Sıfırla
        </button>
      ) : null}
    </div>
  );
}
