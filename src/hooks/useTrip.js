import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { evaluateGpsSample } from "../lib/geo.js";
import { evaluateDeviation } from "../lib/tripAlerts.js";
import { useGeolocationWatch } from "./useGeolocationWatch.js";
import { useWakeLock } from "./useWakeLock.js";

const INITIAL_STATE = {
  status: "idle",
  distanceKm: 0,
  waitingSeconds: 0,
  elapsedSeconds: 0,
  speedKmh: 0,
  points: [],
  startedAt: null,
  error: null,
  lastPosition: null,
};

export function useTrip({
  estimate = null,
  fareTotal = 0,
  fareRange = null,
} = {}) {
  const [state, setState] = useState(INITIAL_STATE);
  const lastAcceptedRef = useRef(null);
  const isTrackingRef = useRef(false);

  const isLive = state.status === "locating" || state.status === "active";
  useWakeLock(isLive);

  const handlePosition = useCallback((sample) => {
    if (!isTrackingRef.current) return;

    const evaluation = evaluateGpsSample(lastAcceptedRef.current, sample);
    if (!evaluation.accept) return;

    lastAcceptedRef.current = sample;

    setState((current) => {
      const nextDistance =
        current.distanceKm +
        (evaluation.skipDistance ? 0 : evaluation.distanceKm);
      const nextWaiting =
        current.waitingSeconds +
        (evaluation.isWaiting ? evaluation.deltaSeconds : 0);

      return {
        ...current,
        status: "active",
        distanceKm: nextDistance,
        waitingSeconds: nextWaiting,
        speedKmh: evaluation.speedKmh,
        lastPosition: sample,
        error: null,
        points: [...current.points, sample].slice(-500),
      };
    });
  }, []);

  const handleError = useCallback((error) => {
    setState((current) => {
      if (current.status === "locating") {
        isTrackingRef.current = false;
        return {
          ...current,
          status: "idle",
          error: error.message,
        };
      }

      return { ...current, error: error.message };
    });
  }, []);

  const { start: startWatch, stop: stopWatch } = useGeolocationWatch({
    onPosition: handlePosition,
    onError: handleError,
  });

  useEffect(() => {
    if (!isLive || !state.startedAt) return undefined;

    const tick = () => {
      setState((current) => {
        if (current.status !== "locating" && current.status !== "active") {
          return current;
        }
        return {
          ...current,
          elapsedSeconds: Math.floor((Date.now() - current.startedAt) / 1000),
        };
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isLive, state.startedAt]);

  const startTrip = useCallback(() => {
    lastAcceptedRef.current = null;
    isTrackingRef.current = true;

    setState({
      ...INITIAL_STATE,
      status: "locating",
      startedAt: Date.now(),
    });

    const ok = startWatch();
    if (!ok) {
      isTrackingRef.current = false;
      setState((current) => ({
        ...current,
        status: "idle",
        startedAt: null,
        error:
          current.error ||
          "Konum servisi başlatılamadı. HTTPS veya localhost kullanın.",
      }));
    }
  }, [startWatch]);

  const endTrip = useCallback(() => {
    isTrackingRef.current = false;
    stopWatch();
    setState((current) => ({
      ...current,
      status: current.status === "idle" ? "idle" : "ended",
      speedKmh: 0,
    }));
  }, [stopWatch]);

  const resetTrip = useCallback(() => {
    isTrackingRef.current = false;
    stopWatch();
    lastAcceptedRef.current = null;
    setState(INITIAL_STATE);
  }, [stopWatch]);

  const clearError = useCallback(() => {
    setState((current) => ({ ...current, error: null }));
  }, []);

  const alerts = useMemo(
    () =>
      evaluateDeviation({
        estimate,
        fareRange,
        fareTotal,
        distanceKm: state.distanceKm,
        currentPosition: state.lastPosition,
        // Canlı yolculukta tutar başta düşük olur; yalnızca üst sınırı izle.
        checkBelow: state.status === "ended" || state.status === "idle",
      }),
    [
      estimate,
      fareRange,
      fareTotal,
      state.distanceKm,
      state.lastPosition,
      state.status,
    ],
  );

  return {
    ...state,
    isLive,
    waitingMinutes: state.waitingSeconds / 60,
    alerts,
    startTrip,
    endTrip,
    resetTrip,
    clearError,
  };
}
