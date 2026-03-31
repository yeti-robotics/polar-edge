"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { TypographyMuted } from "@repo/ui/components/typography";
import type { DriveRatingHistoryPoint } from "../types";

function RankBadge({ rank }: { rank: number }) {
  const colors =
    rank === 1
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : rank === 2
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

  const label = rank === 1 ? "1st" : rank === 2 ? "2nd" : "3rd";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}
    >
      {label}
    </span>
  );
}

export function DriveRatingHistoryTable({ history }: { history: DriveRatingHistoryPoint[] }) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Drive Rating History</CardTitle>
        </CardHeader>
        <CardContent>
          <TypographyMuted>No ranking history available</TypographyMuted>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drive Rating History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Match
                </th>
                <th className="pb-2 pr-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Rank
                </th>
                <th className="pb-2 pr-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Rating
                </th>
                <th className="pb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Uncertainty
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((point) => (
                <tr
                  key={`${point.matchType}-${point.matchNumber}`}
                  className="border-b last:border-0"
                >
                  <td className="py-2 pr-4 tabular-nums">
                    {point.matchType.toUpperCase()} {point.matchNumber}
                  </td>
                  <td className="py-2 pr-4">
                    <RankBadge rank={point.rank} />
                  </td>
                  <td className="py-2 pr-4 font-semibold tabular-nums">
                    {point.ordinal.toFixed(1)}
                  </td>
                  <td className="py-2 tabular-nums text-muted-foreground">
                    {point.sigma.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
