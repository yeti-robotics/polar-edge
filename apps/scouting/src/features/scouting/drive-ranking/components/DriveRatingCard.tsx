import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { TypographyMuted } from "@repo/ui/components/typography";
import type { DriveTeamRating } from "../types";

export function DriveRatingCard({ rating }: { rating: DriveTeamRating | null }) {
  if (!rating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Drive Team Skill</CardTitle>
        </CardHeader>
        <CardContent>
          <TypographyMuted>No drive team ranking data available</TypographyMuted>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drive Team Skill</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Rating
            </p>
            <p className="text-2xl font-bold tabular-nums tracking-tight leading-none">
              {rating.ordinal.toFixed(1)}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Skill (mu)
            </p>
            <p className="text-2xl font-bold tabular-nums tracking-tight leading-none">
              {rating.mu.toFixed(1)}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Uncertainty
            </p>
            <p className="text-2xl font-bold tabular-nums tracking-tight leading-none">
              {rating.sigma.toFixed(2)}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Matches Ranked
            </p>
            <p className="text-2xl font-bold tabular-nums tracking-tight leading-none">
              {rating.matchesRanked}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
