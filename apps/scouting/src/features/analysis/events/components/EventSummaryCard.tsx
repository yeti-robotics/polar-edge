import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import Link from "next/link";
import { routes } from "@/lib/routes";
import type { MainEventOverviewRow } from "../queries";

export function EventSummaryCard({ rows }: { rows: MainEventOverviewRow[] }) {
  const totalTeams = rows.length;
  const teamsScouted = rows.filter((r) => r.matchesScouted >= 1).length;
  const totalMatchesScouted = rows.reduce((sum, r) => sum + r.matchesScouted, 0);

  const totalPointsAcrossMatches = rows.reduce(
    (sum, r) => sum + r.avgTotalPoints * r.matchesScouted,
    0
  );
  const avgPointsPerMatch =
    totalMatchesScouted > 0 ? totalPointsAcrossMatches / totalMatchesScouted : 0;

  const highestScoringTeam =
    rows
      .filter((r) => r.matchesScouted > 0)
      .sort((a, b) => b.avgTotalPoints - a.avgTotalPoints)[0] ?? null;

  const topFive = [...rows].sort((a, b) => b.overallScore - a.overallScore).slice(0, 5);
  const maxScore = topFive[0]?.overallScore ?? 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Summary</CardTitle>
        <CardDescription>Coverage, scoring, and top-ranked teams</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Total teams at event</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {totalTeams.toLocaleString()}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Teams scouted (≥1 stand form)</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {teamsScouted.toLocaleString()}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Total matches scouted</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {totalMatchesScouted.toLocaleString()}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Avg points per match</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {avgPointsPerMatch.toFixed(1)}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Highest-scoring team</p>
            {highestScoringTeam ? (
              <Link
                href={routes.analysis.team(highestScoringTeam.teamNumber)}
                className="mt-1 block text-sm font-semibold text-primary hover:underline"
              >
                #{highestScoringTeam.teamNumber} ({highestScoringTeam.avgTotalPoints.toFixed(1)})
              </Link>
            ) : (
              <p className="mt-1 text-sm font-semibold">—</p>
            )}
          </div>
        </div>

        <div className="rounded-md border p-3">
          <p className="mb-3 text-sm font-medium">Top 5 teams (overall score)</p>
          <div className="space-y-2">
            {topFive.map((row) => {
              const widthPct = Math.max((row.overallScore / maxScore) * 100, 4);
              return (
                <div key={row.teamNumber}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-mono">#{row.teamNumber}</span>
                    <span className="tabular-nums">{row.overallScore.toFixed(1)}</span>
                  </div>
                  <div className="h-2 rounded bg-muted">
                    <div className="h-2 rounded bg-primary" style={{ width: `${widthPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
