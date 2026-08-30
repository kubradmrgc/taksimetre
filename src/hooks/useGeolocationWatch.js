import { useCallback, useEffect, useRef } from "react";

const DEFAULT_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 2_000,
};

/** Konum örneklerini birleştirme aralığı (ms). */
export const MIN_INTERVAL_MS = 4_000;

/**
 * Geolocation watchPosition sarmalayıcısı.
 * start/stop ile kontrol edilir; örnekler MIN_INTERVAL_MS ile throttle edilir.
 */
export function useGeolocationWatch({ onPosition, onError } = {}) {
  const watchIdRef = useRef(null);
  const lastEmittedAtRef = useRef(0);
  const onPositionRef = useRef(onPosition);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onPositionRef.current = onPosition;
  }, [onPosition]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const stop = useCallback(() => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    lastEmittedAtRef.current = 0;
  }, []);

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      onErrorRef.current?.(
        new Error(
          "Bu tarayıcı konum servisini desteklemiyor. HTTPS veya localhost kullanın.",
        ),
      );
      return false;
    }

    stop();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (
          lastEmittedAtRef.current > 0 &&
          now - lastEmittedAtRef.current < MIN_INTERVAL_MS
        ) {
          return;
        }

        lastEmittedAtRef.current = now;
        onPositionRef.current?.({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp || now,
        });
      },
      (error) => {
        let message = "Konum alınamadı.";
        if (error.code === error.PERMISSION_DENIED) {
          message =
            "Konum izni reddedildi. Tarayıcı ayarlarından izin verip tekrar deneyin.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Konum şu an kullanılamıyor. GPS sinyalini kontrol edin.";
        } else if (error.code === error.TIMEOUT) {
          message = "Konum zaman aşımına uğradı. Tekrar deneyin.";
        }
        onErrorRef.current?.(new Error(message));
      },
      DEFAULT_OPTIONS,
    );

    return true;
  }, [stop]);

  useEffect(() => () => stop(), [stop]);

  return { start, stop };
}
