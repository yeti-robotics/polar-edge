"use client";

import NumberFlow, { continuous, type Format } from "@number-flow/react";
import { useTOTP } from "../contexts/TOTPContext";

const format: Format = {
  notation: "standard",
  maximumSignificantDigits: 1,
};

export function CodeFlipper() {
  const { code } = useTOTP();

  const padded = code !== null ? code.toString().padStart(4, "0") : "0000";

  return (
    <div className="flex flex-col items-center gap-16 w-full">
      {/* Code Display */}
      <div className="flex gap-4 md:gap-8 justify-center items-center mt-8">
        {padded.split("").map((digit, index) => (
          <div
            key={index}
            className="bg-white rounded-3xl w-24 h-36 md:w-32 md:h-60 flex items-center justify-center"
          >
            <NumberFlow
              willChange
              plugins={[continuous]}
              value={parseInt(digit, 10)}
              format={format}
              style={
                {
                  "--number-flow-char-height": "1em",
                } as React.CSSProperties
              }
              className={`text-7xl md:text-[160px] font-mono tracking-tighter ${
                code === null ? "text-slate-100" : "text-slate-900"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
