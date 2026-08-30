import { useEffect, useRef, useState } from "react";
import { searchPlaces } from "../lib/routing.js";

/**
 * Varış noktası araması (Nominatim). Seçim onSelect ile üst bileşene iletilir.
 */
export function DestinationSearch({
  selected,
  onSelect,
  onClear,
  disabled = false,
}) {
  const [query, setQuery] = useState(selected?.label ?? "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    if (selected?.label) {
      setQuery(selected.label);
    } else if (!selected) {
      /* query kullanıcıda kalabilir; temizle onClear ile gelir */
    }
  }, [selected]);

  useEffect(() => {
    if (disabled) return undefined;

    const trimmed = query.trim();
    if (trimmed.length < 3 || (selected && selected.label === trimmed)) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);

      try {
        const places = await searchPlaces(trimmed, {
          signal: controller.signal,
        });
        setResults(places);
        setOpen(true);
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message || "Arama başarısız.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, selected, disabled]);

  function handleSelect(place) {
    setQuery(place.label);
    setResults([]);
    setOpen(false);
    onSelect?.(place);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    setError(null);
    onClear?.();
  }

  return (
    <div className="relative">
      <label htmlFor="destination" className="block text-sm font-medium">
        Varış noktası{" "}
        <span className="font-normal text-stone-500">(isteğe bağlı)</span>
      </label>
      <div className="relative mt-1.5 flex gap-2">
        <input
          id="destination"
          type="text"
          autoComplete="off"
          disabled={disabled}
          placeholder="Örn. Taksim Meydanı, İstanbul"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (selected) onClear?.();
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="w-full rounded-xl border border-stone-300/80 bg-white px-3.5 py-2.5 text-base text-ink shadow-sm outline-none transition placeholder:text-stone-400 focus:border-taxi focus:ring-2 focus:ring-taxi/30 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-stone-100"
        />
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="rounded-xl border border-stone-300/80 px-3 text-sm dark:border-white/10"
          >
            Temizle
          </button>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-1 text-xs text-stone-500">Aranıyor…</p>
      ) : null}
      {error ? (
        <p className="mt-1 text-xs text-red-600 dark:text-red-300">{error}</p>
      ) : null}

      {open && results.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-stone-300/80 bg-white shadow-lg dark:border-white/10 dark:bg-panel">
          {results.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                className="w-full px-3.5 py-2.5 text-left text-sm hover:bg-taxi/20 dark:hover:bg-white/10"
                onClick={() => handleSelect(place)}
              >
                {place.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
