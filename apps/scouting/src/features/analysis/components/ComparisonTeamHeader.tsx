"use client";

import { Card, CardContent } from "@repo/ui/components/card";

type Props = {
  teamNumbers: number[];
  teamNames: (string | null)[];
};

function TeamTile({ num, name }: { num: number; name: string | null }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-7xl font-normal tabular-nums leading-none tracking-tight text-foreground">
        {num}
      </span>
      {name ? (
        <span className="text-sm text-primary font-normal truncate max-w-40 text-center">
          {name}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground/40 font-normal">—</span>
      )}
    </div>
  );
}

export function ComparisonTeamHeader({ teamNumbers, teamNames }: Props) {
  if (teamNumbers.length === 2) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_auto_1fr]">
            {/* Left team */}
            <div className="flex flex-col items-center justify-center gap-2 px-8 py-8 border-r border-border/50">
              {teamNumbers[0] !== undefined && (
                <TeamTile num={teamNumbers[0]} name={teamNames[0] ?? null} />
              )}
            </div>

            {/* VS column */}
            <div className="flex flex-col items-center justify-center px-6 py-8 gap-2 bg-muted/30">
              <div className="h-px w-5 bg-border" />
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground select-none">
                vs
              </span>
              <div className="h-px w-5 bg-border" />
            </div>

            {/* Right team */}
            <div className="flex flex-col items-center justify-center gap-2 px-8 py-8 border-l border-border/50">
              {teamNumbers[1] !== undefined && (
                <TeamTile num={teamNumbers[1]} name={teamNames[1] ?? null} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 3–5 teams: divider-separated flex row
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-wrap items-stretch divide-x divide-border/50">
          {teamNumbers.map((num, i) => (
            <div
              key={num}
              className="flex flex-col items-center justify-center gap-2 px-8 py-7 flex-1 min-w-32"
            >
              <span className="text-5xl font-normal tabular-nums leading-none text-foreground">
                {num}
              </span>
              {teamNames[i] ? (
                <span className="text-xs text-primary font-normal truncate max-w-32 text-center">
                  {teamNames[i]}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground/40">—</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
