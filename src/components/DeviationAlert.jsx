/**
 * Aralık dışı / sapma bildirimleri.
 * Hem aydınlık hem karanlık temada okunaklıdır.
 */
export function DeviationAlert({ alerts }) {
  if (!alerts || alerts.level === "ok" || !alerts.messages?.length) {
    return null;
  }

  const isDanger = alerts.level === "danger";

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`rounded-2xl border px-4 py-3 text-sm ${
        isDanger
          ? "border-red-500/60 bg-red-500/15 text-red-800 dark:border-red-500/50 dark:bg-red-500/15 dark:text-red-100"
          : "border-amber-500/60 bg-amber-400/20 text-amber-950 dark:border-amber-400/50 dark:bg-amber-400/15 dark:text-amber-100"
      }`}
    >
      <p className="font-semibold tracking-wide">
        {isDanger
          ? "Uyarı · Aralık dışı / sapma"
          : "Dikkat · Veri şüpheli olabilir"}
      </p>
      <p className="mt-1 text-xs opacity-90">
        Beklenen ücret aralığı dışındaki değerler tarife, mesafe veya güzergâh
        hatasına işaret edebilir.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm opacity-95">
        {alerts.messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
