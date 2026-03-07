"use client";

import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { TypographyMuted } from "@repo/ui/components/typography";
import { useState } from "react";
import type { ValidationMatchScoreRow } from "../queries";

const PROBLEM_THRESHOLD = 15;

function deltaClass(delta: number): string {
  const abs = Math.abs(delta);
  if (abs <= PROBLEM_THRESHOLD) return "text-foreground";
  if (abs <= 30) return "text-warning";
  return "text-destructive";
}

function fmtDelta(delta: number): string {
  return delta > 0 ? `+${delta.toFixed(0)}` : delta.toFixed(0);
}

function isProblem(row: ValidationMatchScoreRow): boolean {
  return (
    Math.abs(row.redScore - row.expRedScore) > PROBLEM_THRESHOLD ||
    Math.abs(row.blueScore - row.expBlueScore) > PROBLEM_THRESHOLD ||
    Math.abs(row.goblinMatch) > PROBLEM_THRESHOLD
  );
}

export function ScoreReconciliationTable({
  rows,
  totalPlayedCount,
}: {
  rows: ValidationMatchScoreRow[];
  totalPlayedCount: number;
}) {
  const problemRows = rows.filter(isProblem);
  const [showAll, setShowAll] = useState(problemRows.length === 0);
  const displayed = showAll ? rows : problemRows;
  const excludedFromCoverage = totalPlayedCount - rows.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Score Reconciliation</CardTitle>
            {excludedFromCoverage > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {excludedFromCoverage} scored {excludedFromCoverage === 1 ? "match" : "matches"}{" "}
                excluded — incomplete org coverage
              </p>
            )}
          </div>
          {rows.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? `Problems only (${problemRows.length})` : `Show all (${rows.length})`}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="px-6 pb-6">
            <TypographyMuted>No fully-covered played matches yet.</TypographyMuted>
          </div>
        ) : displayed.length === 0 ? (
          <div className="px-6 pb-6">
            <TypographyMuted className="text-primary">
              All {rows.length} matches are within threshold — looking good.
            </TypographyMuted>
          </div>
        ) : (
          <div className="max-h-[480px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="text-xs">
                  <TableHead className="py-2 px-3 w-16">Match</TableHead>
                  <TableHead className="py-2 px-3 text-destructive">Red</TableHead>
                  <TableHead className="py-2 px-3">Red Δ</TableHead>
                  <TableHead className="py-2 px-3 text-primary">Blue</TableHead>
                  <TableHead className="py-2 px-3">Blue Δ</TableHead>
                  <TableHead className="py-2 px-3">Goblin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((row) => {
                  const redDelta = row.redScore - row.expRedScore;
                  const blueDelta = row.blueScore - row.expBlueScore;
                  return (
                    <TableRow key={row.matchId} className="text-xs">
                      <TableCell className="py-1.5 px-3 font-mono font-medium">
                        QM {row.matchNumber}
                      </TableCell>
                      <TableCell className="py-1.5 px-3">
                        <span className="font-semibold">{row.redScore}</span>
                        <span className="text-muted-foreground ml-1 text-[11px]">
                          /{row.expRedScore.toFixed(0)}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`py-1.5 px-3 font-mono font-semibold ${deltaClass(redDelta)}`}
                      >
                        {fmtDelta(redDelta)}
                      </TableCell>
                      <TableCell className="py-1.5 px-3">
                        <span className="font-semibold">{row.blueScore}</span>
                        <span className="text-muted-foreground ml-1 text-[11px]">
                          /{row.expBlueScore.toFixed(0)}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`py-1.5 px-3 font-mono font-semibold ${deltaClass(blueDelta)}`}
                      >
                        {fmtDelta(blueDelta)}
                      </TableCell>
                      <TableCell className={`py-1.5 px-3 font-mono ${deltaClass(row.goblinMatch)}`}>
                        {fmtDelta(row.goblinMatch)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
