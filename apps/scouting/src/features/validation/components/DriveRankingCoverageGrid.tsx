"use client";

import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { TypographyMuted } from "@repo/ui/components/typography";
import { useMemo, useState } from "react";
import type { DriveRankingCoverageRow } from "../queries";

function CoverageCell({ covered }: { covered: boolean }) {
  const color = covered
    ? "bg-primary text-primary-foreground"
    : "bg-destructive text-destructive-foreground";
  const label = covered ? "Yes" : "No";
  return (
    <div
      className={`w-10 h-6 rounded flex items-center justify-center text-[10px] font-bold ${color}`}
      title={covered ? "Ranking submitted" : "Missing ranking"}
    >
      {label}
    </div>
  );
}

export function DriveRankingCoverageGrid({ rows }: { rows: DriveRankingCoverageRow[] }) {
  const slotMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const row of rows) {
      map.set(`${row.alliance}-${row.matchNumber}`, row.hasRanking);
    }
    return map;
  }, [rows]);

  const matchNumbers = useMemo(
    () => [...new Set(rows.map((r) => r.matchNumber))].sort((a, b) => a - b),
    [rows]
  );

  const missingMatches = useMemo(
    () => matchNumbers.filter((mn) => !slotMap.get(`red-${mn}`) || !slotMap.get(`blue-${mn}`)),
    [matchNumbers, slotMap]
  );

  const [showAll, setShowAll] = useState(missingMatches.length === 0);
  const displayed = showAll ? matchNumbers : missingMatches;

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Drive Ranking Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <TypographyMuted>No matches found for this event.</TypographyMuted>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Drive Ranking Coverage</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {matchNumbers.length} matches ·{" "}
              <span className="text-destructive">{missingMatches.length} with gaps</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-2"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? `Gaps only (${missingMatches.length})` : `Show all (${matchNumbers.length})`}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {displayed.length === 0 ? (
          <div className="px-6 pb-6">
            <TypographyMuted className="text-primary">
              All {matchNumbers.length} matches have drive rankings for both alliances.
            </TypographyMuted>
          </div>
        ) : (
          <div className="max-h-[480px] overflow-y-auto">
            {/* Header row — sticky */}
            <div className="sticky top-0 z-10 bg-card border-b grid grid-cols-[4rem_2.75rem_2.75rem] gap-x-2 px-4 py-2 text-[11px] font-medium text-muted-foreground">
              <span>Match</span>
              <span className="text-destructive text-center">Red</span>
              <span className="text-primary text-center">Blue</span>
            </div>

            {/* Data rows */}
            <div className="divide-y">
              {displayed.map((matchNumber) => (
                <div
                  key={matchNumber}
                  className="grid grid-cols-[4rem_2.75rem_2.75rem] gap-x-2 items-center px-4 py-1.5"
                >
                  <span className="font-mono text-xs font-medium">QM {matchNumber}</span>
                  <div className="flex justify-center">
                    <CoverageCell covered={slotMap.get(`red-${matchNumber}`) ?? false} />
                  </div>
                  <div className="flex justify-center">
                    <CoverageCell covered={slotMap.get(`blue-${matchNumber}`) ?? false} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
