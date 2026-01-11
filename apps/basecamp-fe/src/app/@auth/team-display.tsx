"use client";

import { useTOTP } from "./totp-context";
export function TeamDisplay({ teams }: { teams: Record<string, string> }) {
  const { code } = useTOTP();

  const padded = code !== null ? code.toString().padStart(4, "0") : "0000";
  const teamName = code !== null && teams ? teams[padded] || teams[code.toString()] || null : null;

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Team Name */}
      <div className="flex flex-col items-center gap-4 text-center">
        {teamName ? (
          <h2 className="text-6xl text-slate-900 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-500">
            {teamName}
          </h2>
        ) : (
          <p className="text-slate-600 text-4xl">No team found</p>
        )}
      </div>
    </div>
  );
}
