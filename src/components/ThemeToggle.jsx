export function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Aydınlık temaya geç" : "Karanlık temaya geç"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300/80 bg-white text-ink transition hover:border-taxi hover:bg-taxi/20 dark:border-white/10 dark:bg-white/5 dark:text-stone-100 dark:hover:bg-taxi/15"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 3v1.6M12 19.4V21M4.9 4.9l1.1 1.1M18 18l1.1 1.1M3 12h1.6M19.4 12H21M4.9 19.1 6 18M18 6l1.1-1.1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M16.5 13.2A6.2 6.2 0 0 1 10.8 7.5 6.4 6.4 0 1 0 16.5 13.2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
