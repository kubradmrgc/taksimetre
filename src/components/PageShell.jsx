import { Link } from "react-router-dom";
import { Header } from "../components/Header.jsx";
import { useTheme } from "../hooks/useTheme.js";


export function PageShell({ children }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,196,0,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(20,21,26,0.08),transparent_40%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(245,196,0,0.12),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_42%)]"
      />
      <main className="relative mx-auto flex min-h-dvh max-w-5xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:py-14">
        <Header theme={theme} onToggleTheme={toggleTheme} />
        {children}
        <p className="pb-4 text-center text-xs text-stone-500 dark:text-stone-400 sm:hidden">
          <Link to="/" className="underline-offset-2 hover:underline">
            Hesapla
          </Link>
          {" · "}
          <Link to="/sehirler" className="underline-offset-2 hover:underline">
            İl tarifeleri
          </Link>
        </p>
      </main>
    </div>
  );
}
