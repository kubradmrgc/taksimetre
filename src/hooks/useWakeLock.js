import { useCallback, useEffect, useRef } from "react";

/**
 * Yolculuk sırasında ekranın uyku moduna geçmesini engeller (Wake Lock API).
 * Destek yoksa sessizce atlanır.
 */
export function useWakeLock(active) {
  const lockRef = useRef(null);

  const release = useCallback(async () => {
    try {
      await lockRef.current?.release();
    } catch {
      /* kilit zaten bırakılmış olabilir */
    }
    lockRef.current = null;
  }, []);

  const request = useCallback(async () => {
    if (!active || !("wakeLock" in navigator)) return;

    try {
      lockRef.current = await navigator.wakeLock.request("screen");
      lockRef.current.addEventListener("release", () => {
        lockRef.current = null;
      });
    } catch {
      /* kullanıcı etkileşimi / güç politikası engelleyebilir */
    }
  }, [active]);

  useEffect(() => {
    if (!active) {
      release();
      return undefined;
    }

    request();

    const onVisibility = () => {
      if (document.visibilityState === "visible" && active) {
        request();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      release();
    };
  }, [active, request, release]);
}
