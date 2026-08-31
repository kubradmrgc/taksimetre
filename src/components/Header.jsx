import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle.jsx";

export function Header({ theme, onToggleTheme }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-taxi shadow-sm dark:bg-taxi dark:text-ink"
          aria-label="Ana sayfa"
        >
          <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" aria-hidden="true">
            <path
              d="M6 20h20l-1.5-6.5A3 3 0 0 0 21.6 11H10.4a3 3 0 0 0-2.9 2.5L6 20Z"
              fill="currentColor"
            />
            <rect x="11" y="7" width="10" height="3" rx="1" fill="currentColor" />
            <circle cx="10.5" cy="22.5" r="2" fill="currentColor" opacity="0.55" />
            <circle cx="21.5" cy="22.5" r="2" fill="currentColor" opacity="0.55" />
          </svg>
        </Link>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-taxi-dim dark:text-taxi">
            Anlık hesap
          </p>
          <Link to="/" className="block text-xl font-semibold tracking-tight sm:text-2xl">
            Taksimetre
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <nav aria-label="Site" className="hidden items-center gap-1 sm:flex">
          <Link
            to="/"
            className="rounded-xl px-3 py-2 text-sm font-medium text-stone-600 transition hover:text-ink dark:text-stone-300 dark:hover:text-white"
          >
            Hesapla
          </Link>
          <Link
            to="/sehirler"
            className="rounded-xl px-3 py-2 text-sm font-medium text-stone-600 transition hover:text-ink dark:text-stone-300 dark:hover:text-white"
          >
            İl tarifeleri
          </Link>
        </nav>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}
