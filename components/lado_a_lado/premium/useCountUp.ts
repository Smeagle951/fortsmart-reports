'use client';

import { useEffect, useState } from 'react';

/** Número animado (ease-out) para sensação “premium” sem dependência extra. */
export function useCountUp(target: number, durationMs = 900, decimals = 0): number {
  const [v, setV] = useState(0);
  const t = Number.isFinite(target) ? target : 0;

  useEffect(() => {
    let start: number | null = null;
    let frame = 0;
    const from = 0;
    const step = (time: number) => {
      if (start == null) start = time;
      const p = Math.min(1, (time - start) / durationMs);
      const eased = 1 - (1 - p) ** 3;
      setV(from + (t - from) * eased);
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [t, durationMs]);

  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}
