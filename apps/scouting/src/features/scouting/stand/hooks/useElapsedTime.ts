"use client";

import { useEffect, useState } from "react";

/**
 * Hook that returns elapsed seconds since a given start timestamp.
 * Updates every second while startedAt is not null and frozenAt is not set.
 * When frozenAt is provided, returns the elapsed time as of that moment (frozen).
 */
export function useElapsedTime(startedAt: number | null, frozenAt?: number | null): number {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!startedAt || frozenAt != null) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, frozenAt]);

  if (!startedAt) return 0;
  if (frozenAt != null) return Math.floor((frozenAt - startedAt) / 1000);

  return Math.floor((Date.now() - startedAt) / 1000);
}
