"use client";

import { useEffect, useState } from "react";

/**
 * Hook that returns elapsed seconds since a given start timestamp.
 * Updates every second while startedAt is not null.
 */
export function useElapsedTime(startedAt: number | null): number {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!startedAt) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) return 0;

  return Math.floor((Date.now() - startedAt) / 1000);
}
