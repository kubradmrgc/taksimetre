import { useEffect, useState } from "react";

const DISMISS_KEY = "taksimetre-pwa-dismissed";


export function PwaInstallBanner() {
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return undefined;
    } catch {
      /* private mode */
    }

    function onPrompt(event) {
      event.preventDefault();
      setDeferred(event);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!visible || !deferred) return null;

  async function handleInstall() {
    deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      /* kullanıcı kapattı */
    }
    setDeferred(null);
    setVisible(false);
  }

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
    setDeferred(null);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-5xl px-4 pb-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-300/80 bg-card/95 px-4 py-3 shadow-lg backdrop-blur dark:border-white/15 dark:bg-panel/95">
        <p className="text-sm text-stone-700 dark:text-stone-200">
          Taksimetre’yi ana ekrana ekleyin — çevrimdışı kabuk ve hızlı açılış.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-xl border border-stone-300/80 px-3 py-2 text-sm font-medium dark:border-white/15"
          >
            Sonra
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="rounded-xl bg-taxi px-3 py-2 text-sm font-semibold text-ink"
          >
            Yükle
          </button>
        </div>
      </div>
    </div>
  );
}
