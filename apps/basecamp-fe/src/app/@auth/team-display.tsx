"use client";

import { useTOTP } from "./totp-context";

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

  // Format location string based on available data
  const formatLocation = (location: TeamLocation | undefined): string | null => {
    if (!location) return null;

    const { city, state_prov, country } = location;

    // If city or country is missing, omit location entirely
    if (!city || !country) return null;

    // If state_prov is missing, show city and country only
    if (!state_prov) {
      return `${city}, ${country}`;
    }

    // Show full location
    return `${city}, ${state_prov}, ${country}`;
  };

  const locationString = teamData ? formatLocation(teamData.location) : null;

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Team Name and Location */}
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
