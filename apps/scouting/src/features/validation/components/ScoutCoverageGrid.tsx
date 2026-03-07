"use client";

import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { TypographyMuted } from "@repo/ui/components/typography";
import { useMemo, useState } from "react";
import type { ScoutCoverageRow } from "../queries";

// A compact colored square showing scout count for one slot.
// 0 → destructive  |  1 → warning  |  2+ → primary
function CoverageCell({ count }: { count: number }) {
  const color =
    count === 0
      ? "bg-destructive text-destructive-foreground"
      : count === 1
        ? "bg-warning text-warning-foreground"
        : "bg-primary text-primary-foreground";
  return (
    <div
      className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${color}`}
      title={`${count} scout${count === 1 ? "" : "s"}`}
    >
      {count > 9 ? "9+" : count}
    </div>
  );
}

function hasProblem(slotMap: Map<string, number>, matchNumber: number): boolean {
  for (const alliance of ["red", "blue"]) {
    for (const pos of [1, 2, 3]) {
      const count = slotMap.get(`${alliance}-${matchNumber}-${pos}`) ?? 0;
      if (count < 2) return true;
    }
  }
  return false;
}

export function ScoutCoverageGrid({ rows }: { rows: ScoutCoverageRow[] }) {
  const slotMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(`${row.alliance}-${row.matchNumber}-${row.position}`, row.scoutCount);
    }
    return map;
  }, [rows]);

  const matchNumbers = useMemo(
    () => [...new Set(rows.map((r) => r.matchNumber))].sort((a, b) => a - b),
    [rows]
  );
  const problemMatches = useMemo(
    () => matchNumbers.filter((mn) => hasProblem(slotMap, mn)),
    [matchNumbers, slotMap]
  );

  const [showAll, setShowAll] = useState(problemMatches.length === 0);
  const displayed = showAll ? matchNumbers : problemMatches;

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scout Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <TypographyMuted>No team-match slots found for this event.</TypographyMuted>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Scout Coverage</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {matchNumbers.length} matches ·{" "}
              <span className="text-destructive">{problemMatches.length} with gaps</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-2"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? `Gaps only (${problemMatches.length})` : `Show all (${matchNumbers.length})`}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {displayed.length === 0 ? (
          <div className="px-6 pb-6">
            <TypographyMuted className="text-primary">
              All {matchNumbers.length} matches have full double coverage.
            </TypographyMuted>
          </div>
        ) : (
          <div className="max-h-[480px] overflow-y-auto">
            {/* Header row — sticky */}
            <div className="sticky top-0 z-10 bg-card border-b grid grid-cols-[4rem_repeat(3,1.75rem)_0.5rem_repeat(3,1.75rem)] gap-x-1 px-4 py-2 text-[11px] font-medium text-muted-foreground">
              <span>Match</span>
              <span className="text-destructive text-center">R1</span>
              <span className="text-destructive text-center">R2</span>
              <span className="text-destructive text-center">R3</span>
              <span /> {/* spacer */}
              <span className="text-primary text-center">B1</span>
              <span className="text-primary text-center">B2</span>
              <span className="text-primary text-center">B3</span>
            </div>

            {/* Data rows */}
            <div className="divide-y">
              {displayed.map((matchNumber) => (
                <div
                  key={matchNumber}
                  className="grid grid-cols-[4rem_repeat(3,1.75rem)_0.5rem_repeat(3,1.75rem)] gap-x-1 items-center px-4 py-1.5"
                >
                  <span className="font-mono text-xs font-medium">QM {matchNumber}</span>
                  {([1, 2, 3] as const).map((pos) => (
                    <div key={`r${pos}`} className="flex justify-center">
                      <CoverageCell count={slotMap.get(`red-${matchNumber}-${pos}`) ?? 0} />
                    </div>
                  ))}
                  <span /> {/* spacer */}
                  {([1, 2, 3] as const).map((pos) => (
                    <div key={`b${pos}`} className="flex justify-center">
                      <CoverageCell count={slotMap.get(`blue-${matchNumber}-${pos}`) ?? 0} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
