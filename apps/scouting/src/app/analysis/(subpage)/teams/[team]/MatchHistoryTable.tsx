"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { ChevronDown } from "lucide-react";
import React, { useState } from "react";
import type { MatchDetails, MatchHistoryItem } from "@/app/data/(subpage)/teams/[team]/actions";
import { MatchDetailsExpansion } from "./MatchDetailsExpansion";

interface MatchHistoryTableProps {
  matches: MatchHistoryItem[];
  matchDetails: Map<number, MatchDetails | null>;
}

function formatMatchType(matchType: string): string {
  const typeMap: Record<string, string> = {
    qm: "Qual",
    ef: "Eighth",
    qf: "Quarter",
    sf: "Semi",
    f: "Final",
  };
  return typeMap[matchType] || matchType.toUpperCase();
}

function formatAlliance(alliance: "red" | "blue"): string {
  return alliance === "red" ? "Red" : "Blue";
}

export function MatchHistoryTable({ matches, matchDetails }: MatchHistoryTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  if (matches.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No match data available for this team from your organization.
      </div>
    );
  }

  const toggleRow = (teamMatchId: number) => {
    setExpandedRow(expandedRow === teamMatchId ? null : teamMatchId);
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Match</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Alliance</TableHead>
            <TableHead>Position</TableHead>
            <TableHead className="text-right">Exp Fuel</TableHead>
            <TableHead className="text-right">Exp Tower</TableHead>
            <TableHead className="text-right">Clank</TableHead>
            <TableHead className="text-right">Cycles</TableHead>
            <TableHead className="text-right">Climbs</TableHead>
            <TableHead className="text-right">Scouts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => {
            const isExpanded = expandedRow === match.teamMatchId;
            return (
              <React.Fragment key={match.teamMatchId}>
                <TableRow className="cursor-pointer" onClick={() => toggleRow(match.teamMatchId)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                      <span>
                        {formatMatchType(match.matchType)} {match.matchNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{match.eventCode}</TableCell>
                  <TableCell>{formatAlliance(match.alliance)}</TableCell>
                  <TableCell>{match.position}</TableCell>
                  <TableCell className="text-right">{match.expFuelActive.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{match.expTower.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{match.clank.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{match.cycleSummary.totalCycles}</TableCell>
                  <TableCell className="text-right">
                    {match.climbSummary.totalAttempts > 0
                      ? `${match.climbSummary.totalAttempts} (${(match.climbSummary.successRate * 100).toFixed(0)}%)`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">{match.nScouts}</TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={10} className="p-0">
                      <div className="px-4 pb-4">
                        <MatchDetailsExpansion
                          details={matchDetails.get(match.teamMatchId) ?? null}
                          cycleSummary={match.cycleSummary}
                          climbSummary={match.climbSummary}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
