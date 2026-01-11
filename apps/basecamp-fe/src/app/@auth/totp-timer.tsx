"use client";

import { useTOTP } from "./totp-context";

export function TOTPTimer() {
  const { code, secondsLeft } = useTOTP();

  const paddedSecondsLeft = secondsLeft.toString().padStart(2, "0");

  return (
    <div
      className={`text-xl md:text-3xl font-mono uppercase tracking-[0.3em] transition-colors duration-300 ${
        secondsLeft < 10 ? "text-red-500 animate-pulse" : "text-slate-700"
      }`}
    >
      {code !== null ? `Expires in ${paddedSecondsLeft}s` : "Generating..."}
    </div>
  );
}
