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
import Link from "next/link";
import { routes } from "@/lib/routes";
import type { DriveTeamRating } from "../types";

export function DriveRatingLeaderboard({ ratings }: { ratings: DriveTeamRating[] }) {
  if (ratings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Drive Team Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <TypographyMuted>
            No drive team rankings yet. Scouting leads can submit rankings from the Drive Team
            Ranking form.
          </TypographyMuted>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drive Team Rankings</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-right">Rating</TableHead>
              <TableHead className="text-right">Skill</TableHead>
              <TableHead className="text-right">Uncertainty</TableHead>
              <TableHead className="text-right">Ranked</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ratings.map((r, index) => (
              <TableRow key={r.teamNumber}>
                <TableCell className="font-mono text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  <Link
                    href={routes.analysis.team(r.teamNumber)}
                    className="font-medium hover:underline"
                  >
                    {r.teamNumber}
                    {r.teamName && (
                      <span className="ml-2 text-muted-foreground font-normal">{r.teamName}</span>
                    )}
                  </Link>
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {r.ordinal.toFixed(1)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{r.mu.toFixed(1)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {r.sigma.toFixed(2)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{r.matchesRanked}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
