function formatPhoneDisplay(phone) {
  if (!phone) return "";
  const raw = String(phone);
  if (raw.length === 3) return raw;
  if (raw.startsWith("0") && raw.length === 11) {
    return `${raw.slice(0, 4)} ${raw.slice(4, 7)} ${raw.slice(7)}`;
  }
  return raw;
}

export function ContactCard({ contact }) {
  const tel = contact.phone ? `tel:${contact.phone.replace(/[^\d+]/g, "")}` : null;
  const isEmergency = contact.priority === "emergency";

  return (
    <article
      className={`rounded-2xl border px-4 py-3 ${
        isEmergency
          ? "border-red-500/50 bg-red-500/10"
          : "border-stone-300/70 bg-white/80 dark:border-white/10 dark:bg-white/5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-ink dark:text-stone-100">
            {contact.name}
          </h4>
          {contact.role ? (
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              {contact.role}
            </p>
          ) : null}
        </div>
        {tel ? (
          <a
            href={tel}
            className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold ${
              isEmergency
                ? "bg-red-500 text-white hover:bg-red-400"
                : "bg-taxi text-ink hover:bg-taxi/90"
            }`}
          >
            Ara
          </a>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {contact.phone ? (
          <a
            href={tel}
            className="font-mono font-medium text-ink underline-offset-2 hover:underline dark:text-stone-100"
          >
            {formatPhoneDisplay(contact.phone)}
          </a>
        ) : (
          <span className="text-xs text-stone-500">Telefon yok</span>
        )}
        {contact.website ? (
          <a
            href={contact.website}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-taxi-dim hover:underline dark:text-taxi"
          >
            Web sitesi
          </a>
        ) : null}
      </div>
    </article>
  );
}
