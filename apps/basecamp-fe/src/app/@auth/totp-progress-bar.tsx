"use client";

import { useTOTP } from "./totp-context";

export function TOTPProgressBar() {
  const { secondsLeft, progress } = useTOTP();

  return (
    <div className="fixed top-0 left-0 right-0 h-4 z-50">
      <div
        className={`h-full transition-all duration-100 ease-linear rounded-r-full ${
          secondsLeft < 10 ? "bg-red-500" : "bg-yeti-400"
        }`}
        style={{ width: `${100 - progress}%` }}
      />
    </div>
  );
}
