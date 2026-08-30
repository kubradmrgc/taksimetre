export function DeviationAlert({ alerts }) {
  if (!alerts || alerts.level === "ok" || alerts.messages.length === 0) {
    return null;
  }

  const isDanger = alerts.level === "danger";

  return (
    <div
      role="alert"
      className={`rounded-2xl border px-4 py-3 text-sm ${
        isDanger
          ? "border-red-500/50 bg-red-500/15 text-red-100"
          : "border-amber-400/50 bg-amber-400/15 text-amber-100"
      }`}
    >
      <p className="font-semibold tracking-wide">
        {isDanger ? "Uyarı / Sapma bildirimi" : "Dikkat"}
      </p>
      <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm opacity-95">
        {alerts.messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
