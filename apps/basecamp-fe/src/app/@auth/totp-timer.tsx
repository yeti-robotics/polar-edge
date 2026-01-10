"use client";

import { useTOTP } from "./totp-context";

export function TOTPTimer() {
  const { code, secondsLeft } = useTOTP();

  return (
    <div
      className={`text-xl font-bold font-mono uppercase tracking-[0.2em] transition-colors duration-300 ${
        secondsLeft < 10 ? "text-red-500 animate-pulse" : "text-slate-300"
      }`}
    >
      {code !== null ? `Expires in ${secondsLeft}s` : "Generating..."}
    </div>
  );
}
