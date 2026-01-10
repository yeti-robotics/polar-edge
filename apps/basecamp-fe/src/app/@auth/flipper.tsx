"use client";

import NumberFlow, { continuous, type Format } from "@number-flow/react";
import { generateTOTP } from "@repo/twofa/client";
import { useCallback, useEffect, useRef, useState } from "react";

const format: Format = {
  notation: "standard",
  maximumSignificantDigits: 1,
};

function useTOTPCode(secret: string, intervalMs: number) {
  const [code, setCode] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const generateCode = useCallback(async () => {
    try {
      const newCode = await generateTOTP(secret, {
        timeStep: intervalMs / 1000,
        digits: 4,
      });
      return newCode;
    } catch (error) {
      console.error("Failed to generate TOTP code:", error);
      return null;
    }
  }, [secret, intervalMs]);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run on client side
    if (!isClient) return;

    let isMounted = true;

    // Generate initial code
    generateCode().then((code) => {
      if (!isMounted) return;
      setCode(code);
    });

    // align first refresh to the next interval boundary
    const msToNextBoundary = intervalMs - (Date.now() % intervalMs);
    timeoutRef.current = setTimeout(async () => {
      if (!isMounted) return;

      const next = await generateCode();
      if (!isMounted) return;

      setCode(next);
      intervalRef.current = setInterval(async () => {
        if (!isMounted) return;
        const newCode = await generateCode();
        if (isMounted) {
          setCode(newCode);
        }
      }, intervalMs);
    }, msToNextBoundary);

    return () => {
      isMounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [generateCode, intervalMs, isClient]);

  return code;
}

export function CodeFlipper({ secret }: { secret: string }) {
  const [isClient, setIsClient] = useState(false);
  const code = useTOTPCode(secret, 30 * 1000);

  const [secondsLeft, setSecondsLeft] = useState<number>(30);

  useEffect(() => {
    setIsClient(true);
    // Calculate initial seconds left on client
    const ms = 30_000 - (Date.now() % 30_000);
    setSecondsLeft(Math.ceil(ms / 1000));
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const id = setInterval(() => {
      const ms = 30_000 - (Date.now() % 30_000);
      setSecondsLeft(Math.ceil(ms / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isClient]);

  const padded = code !== null ? code.toString().padStart(4, "0") : "0000";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-6 text-[128px] min-h-[128px]">
        {padded.split("").map((digit, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: needed as only index exists, can maybe be ported to useId later
          <div key={`digit-${index}`} className="flex flex-col items-center">
            <NumberFlow
              style={
                {
                  "--number-flow-char-height": "128px",
                  fontFamily: "var(--font-space-mono), monospace",
                } as React.CSSProperties
              }
              willChange
              plugins={[continuous]}
              value={parseInt(digit, 10)}
              format={format}
              className={`text-[128px] ${code === null ? "text-muted-foreground/20" : ""}`}
            />
          </div>
        ))}
      </div>
      <div
        className={`text-muted-foreground text-xl min-h-6 ${secondsLeft < 10 && "text-red-600"}`}
      >
        {code !== null ? `Refreshing in ${secondsLeft}s` : "Loading..."}
      </div>
    </div>
  );
}
