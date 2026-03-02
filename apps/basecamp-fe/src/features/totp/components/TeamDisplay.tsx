"use client";

import { useTOTP } from "../contexts/TOTPContext";

type TeamLocation = {
  city: string | null;
  state_prov: string | null;
  country: string | null;
};

type TeamData = {
  name: string;
  location: TeamLocation;
};

type Teams = Record<string, TeamData>;

export function TeamDisplay({ teams }: { teams: Teams }) {
  const { code } = useTOTP();

  const padded = code !== null ? code.toString().padStart(4, "0") : "0000";
  const teamData = code !== null && teams ? teams[padded] || teams[code.toString()] || null : null;

  const formatLocation = (location: TeamLocation | undefined): string | null => {
    if (!location) return null;

    const { city, state_prov, country } = location;

    if (!city || !country) return null;

    if (!state_prov) {
      return `${city}, ${country}`;
    }

    return `${city}, ${state_prov}, ${country}`;
  };

  const locationString = teamData ? formatLocation(teamData.location) : null;

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex flex-col items-center gap-2 text-center">
        {teamData ? (
          <>
            <h2 className="text-6xl text-slate-900 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-500">
              {teamData.name}
            </h2>
            {locationString && (
              <p className="text-2xl text-slate-600 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                {locationString}
              </p>
            )}
          </>
        ) : (
          <p className="text-slate-600 text-4xl">No team found</p>
        )}
      </div>
    </div>
  );
}
