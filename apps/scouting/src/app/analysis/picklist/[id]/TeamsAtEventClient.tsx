"use client";

import { Badge } from "@repo/ui/components/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import Link from "next/link";
import { useState } from "react";
import { QuickAddTeamButton } from "./QuickAddTeamButton";

interface TeamWithMetrics {
  teamNumber: number;
  teamName: string | null;
  avgTotalPoints?: number;
  climbSuccessPct?: number;
  uptimePct?: number;
  matchesScouted?: number;
}

interface Picklist {
  id: string;
  name: string;
}

interface TeamsAtEventClientProps {
  teams: TeamWithMetrics[];
  picklists: Picklist[];
  currentPicklistId: string;
  picklistTeams: number[];
  nextRank: number;
}

export function TeamsAtEventClient({
  teams,
  picklists,
  currentPicklistId,
  picklistTeams,
  nextRank,
}: TeamsAtEventClientProps) {
  const [selectedPicklistId, setSelectedPicklistId] = useState(currentPicklistId);

  return (
    <div className="space-y-4">
      {picklists.length > 1 && (
        <div className="flex items-center gap-2">
          <label htmlFor="picklist-select" className="text-sm font-medium">
            Add to picklist:
          </label>
          <Select value={selectedPicklistId} onValueChange={setSelectedPicklistId}>
            <SelectTrigger id="picklist-select" className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {picklists.map((pl) => (
                <SelectItem key={pl.id} value={pl.id}>
                  {pl.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Avg Pts</TableHead>
            <TableHead className="text-right">Climb %</TableHead>
            <TableHead className="text-right">Uptime %</TableHead>
            <TableHead className="text-right">Matches</TableHead>
            <TableHead className="text-right">Action</TableHead>
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
                <TableCell className="font-mono font-bold">
                  <Link
                    href={`/data/teams/${team.teamNumber}`}
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
                <TableCell className="text-right">
                  <div className="inline-flex items-center justify-end">
                    {inPicklist ? (
                      <Badge variant="secondary">✓ In Picklist</Badge>
                    ) : (
                      <QuickAddTeamButton
                        picklistId={selectedPicklistId}
                        teamNumber={team.teamNumber}
                        rank={nextRank}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
