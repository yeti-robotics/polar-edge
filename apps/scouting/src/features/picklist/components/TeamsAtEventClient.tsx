"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { QuickAddTeamButton } from "./QuickAddTeamButton";

interface TeamWithMetrics {
  teamNumber: number;
  teamName: string | null;
  avgTotalPoints?: number;
  climbSuccessPct?: number;
  uptimePct?: number;
  matchesScouted?: number;
}

interface TeamsAtEventClientProps {
  teams: TeamWithMetrics[];
  currentPicklistId: string;
  picklistTeams: number[];
  nextRank: number;
}

export function TeamsAtEventClient({
  teams,
  currentPicklistId,
  picklistTeams,
  nextRank,
}: TeamsAtEventClientProps) {
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right"></TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Avg Pts</TableHead>
            <TableHead className="text-right">Climb %</TableHead>
            <TableHead className="text-right">Uptime %</TableHead>
            <TableHead className="text-right">Matches</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => {
            const inPicklist = picklistTeams.includes(team.teamNumber);
            return (
              <TableRow
                data-removed={inPicklist}
                key={team.teamNumber}
                className="data-[removed=true]:opacity-50 h-12"
              >
                <TableCell className="text-right min-w-20">
                  <div className="inline-flex items-center justify-end">
                    {inPicklist ? (
                      <span className="text-muted-foreground">Added</span>
                    ) : (
                      <QuickAddTeamButton
                        picklistId={currentPicklistId}
                        teamNumber={team.teamNumber}
                        rank={nextRank}
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-mono font-bold">
                  <Link
                    href={routes.analysis.team(team.teamNumber)}
                    className="text-primary hover:underline"
                  >
                    {team.teamNumber}
                  </Link>
                </TableCell>
                <TableCell>{team.teamName || "—"}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {team.avgTotalPoints !== undefined ? team.avgTotalPoints.toFixed(1) : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {team.climbSuccessPct !== undefined
                    ? `${Math.round(team.climbSuccessPct)}%`
                    : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {team.uptimePct !== undefined ? `${Math.round(team.uptimePct)}%` : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {team.matchesScouted !== undefined ? team.matchesScouted : "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
