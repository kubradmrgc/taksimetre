import { useEffect, useRef, useState } from "react";

export function useAnimatedNumber(target, durationMs = 420) {
  const [displayValue, setDisplayValue] = useState(target);
  const displayRef = useRef(target);

  useEffect(() => {
    const from = displayRef.current;
    const delta = target - from;

    if (Math.abs(delta) < 0.005) {
      displayRef.current = target;
      setDisplayValue(target);
      return undefined;
    }

    const startedAt = performance.now();
    let frameId;

    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      const next = from + delta * eased;

      displayRef.current = next;
      setDisplayValue(next);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, durationMs]);

  return displayValue;
}
