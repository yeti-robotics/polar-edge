"use client";

import NumberFlow, { continuous, type Format } from "@number-flow/react";
import { useCallback, useEffect, useRef, useState } from "react";

const format: Format = {
  notation: "standard",
  maximumSignificantDigits: 1,
};

function usePollingCode(
  initialCode: string,
  fetcher: () => Promise<string | null>,
  intervalMs: number
) {
  const [code, setCode] = useState<string | null>(initialCode);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    // align first refresh to the next interval boundary
    const msToNextBoundary = intervalMs - (Date.now() % intervalMs);
    timeoutRef.current = setTimeout(async () => {
      if (!isMounted) return;

      const next = await fetcher();
      if (!isMounted) return;

      setCode(next);
      intervalRef.current = setInterval(() => {
        if (!isMounted) return;
        fetcher().then(setCode);
      }, intervalMs);
    }, msToNextBoundary);

    return () => {
      isMounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetcher, intervalMs]);
  return code;
}

export function CodeFlipper({ initialCode }: { initialCode: string }) {
  const fetchCode = useCallback(async () => {
    const res = await fetch("/api", { next: { revalidate: 15 } });
    if (!res.ok) return null;
    return res.text();
  }, []);

  const code = usePollingCode(initialCode, fetchCode, 30 * 1000);

  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const ms = 30_000 - (Date.now() % 30_000);
    return Math.ceil(ms / 1000);
  });

  useEffect(() => {
    const id = setInterval(() => {
      const ms = 30_000 - (Date.now() % 30_000);
      setSecondsLeft(Math.ceil(ms / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (!code) {
    return null;
  }

  const padded = code.toString().padStart(4, "0");

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2 text-[128px]">
        {padded.split("").map((digit, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: needed as only index exists, can maybe be ported to useId later
          <div key={`digit-${index}`} className="flex flex-col items-center text-9xl">
            <NumberFlow
              style={
                {
                  "--number-flow-char-height": "128px",
                } as React.CSSProperties
              }
              willChange
              plugins={[continuous]}
              value={parseInt(digit, 10)}
              format={format}
              className="text-[128px]"
            />
          </div>
        ))}
      </div>
      <div className={`text-muted-foreground text-xl ${secondsLeft < 10 && "text-red-600"}`}>
        Refreshes in {secondsLeft}s
      </div>
    </div>
  );
}
