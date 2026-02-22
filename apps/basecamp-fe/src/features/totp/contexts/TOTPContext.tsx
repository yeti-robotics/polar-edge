"use client";

import { generateTOTP } from "@repo/twofa/client";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export const INTERVAL_MS = 30_000;

interface TOTPContextValue {
  code: number | null;
  secondsLeft: number;
  progress: number;
}

const TOTPContext = createContext<TOTPContextValue | undefined>(undefined);

interface TOTPProviderProps {
  secret: string;
  intervalMs?: number;
  children: ReactNode;
}

export function TOTPProvider({ secret, intervalMs = INTERVAL_MS, children }: TOTPProviderProps) {
  const [code, setCode] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(intervalMs / 1000);
  const [progress, setProgress] = useState<number>(100);
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

  useEffect(() => {
    let isMounted = true;

    const updateCodeAndCountdown = async () => {
      if (!isMounted) return;
      const newCode = await generateCode();
      if (!isMounted) return;
      setCode(newCode);

      const msToNextBoundary = intervalMs - (Date.now() % intervalMs);
      setSecondsLeft(Math.ceil(msToNextBoundary / 1000));
      setProgress((msToNextBoundary / intervalMs) * 100);
    };

    updateCodeAndCountdown();

    intervalRef.current = setInterval(() => {
      if (!isMounted) return;
      const msToNextBoundary = intervalMs - (Date.now() % intervalMs);
      setSecondsLeft(Math.ceil(msToNextBoundary / 1000));
      setProgress((msToNextBoundary / intervalMs) * 100);
    }, 100);

    const scheduleNextCode = () => {
      const msToNextBoundary = intervalMs - (Date.now() % intervalMs);
      timeoutRef.current = setTimeout(async () => {
        if (!isMounted) return;
        const newCode = await generateCode();
        setCode(newCode);
        scheduleNextCode();
      }, msToNextBoundary);
    };

    scheduleNextCode();

    return () => {
      isMounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [generateCode, intervalMs]);

  const value: TOTPContextValue = {
    code,
    secondsLeft,
    progress,
  };

  return <TOTPContext.Provider value={value}>{children}</TOTPContext.Provider>;
}

export function useTOTP() {
  const context = useContext(TOTPContext);
  if (context === undefined) {
    throw new Error("useTOTP must be used within a TOTPProvider");
  }
  return context;
}
