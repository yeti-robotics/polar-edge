"use client";

import { Button } from "@repo/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useOptimistic, useState } from "react";
import type { WorkabilityNote } from "@/features/scouting/workability/types";
import { routes } from "@/lib/routes";
import { removeTeamFromPicklist, reorderPicklistTeam, togglePickedStatus } from "../actions";
import { CompatibilityNotesDialog } from "./CompatibilityNotesDialog";
import { NotesCell } from "./NotesCell";
import { PickedCheckbox } from "./PickedCheckbox";
import { RemoveTeamButton } from "./RemoveTeamButton";
import { ReorderButtons } from "./ReorderButtons";

interface Team {
  teamNumber: number;
  rank: number;
  teamName: string;
  picked: boolean;
  notes: string;
  avgTotalPoints?: number;
  climbSuccessPct?: number;
  uptimePct?: number;
  matchesScouted?: number;
  avgDriverWorkability: number | null;
  avgHumanPlayerWorkability: number | null;
  compositeCompatibilityScore: number | null;
  submissionCount: number;
  noteCount: number;
  compatibilityNotes: WorkabilityNote[];
}

interface PicklistTeamsTableProps {
  picklistId: string;
  initialTeams: Team[];
}

type TeamAction =
  | { type: "remove"; teamNumber: number }
  | { type: "reorder"; teamNumber: number; newRank: number }
  | { type: "togglePicked"; teamNumber: number; picked: boolean };

const optionalColumns = [
  { key: "name", label: "Name" },
  { key: "avgTotalPoints", label: "Avg Pts" },
  { key: "climbSuccessPct", label: "Climb %" },
  { key: "uptimePct", label: "Uptime %" },
  { key: "matchesScouted", label: "Matches" },
  { key: "compositeCompatibilityScore", label: "Compat" },
  { key: "avgDriverWorkability", label: "Driver Fit" },
  { key: "avgHumanPlayerWorkability", label: "HP Fit" },
  { key: "submissionCount", label: "Compat Count" },
  { key: "compatibilityNotes", label: "Compat Notes" },
  { key: "notes", label: "Notes" },
] as const;

type OptionalColumnKey = (typeof optionalColumns)[number]["key"];

const defaultVisibleColumns: Record<OptionalColumnKey, boolean> = {
  name: true,
  avgTotalPoints: true,
  climbSuccessPct: true,
  uptimePct: true,
  matchesScouted: true,
  compositeCompatibilityScore: true,
  avgDriverWorkability: false,
  avgHumanPlayerWorkability: false,
  submissionCount: true,
  compatibilityNotes: true,
  notes: true,
};

export function PicklistTeamsTable({ picklistId, initialTeams }: PicklistTeamsTableProps) {
  const router = useRouter();
  const [visibleColumns, setVisibleColumns] =
    useState<Record<OptionalColumnKey, boolean>>(defaultVisibleColumns);
  const [optimisticTeams, updateOptimisticTeams] = useOptimistic<Team[], TeamAction>(
    initialTeams,
    (state, action) => {
      switch (action.type) {
        case "remove": {
          const filtered = state.filter((t) => t.teamNumber !== action.teamNumber);
          // Recompact ranks
          return filtered.map((team, index) => ({
            ...team,
            rank: index + 1,
          }));
        }
        case "reorder": {
          const team = state.find((t) => t.teamNumber === action.teamNumber);
          if (!team) return state;

          const oldRank = team.rank;
          const newRank = action.newRank;

          return state
            .map((t) => {
              if (t.teamNumber === action.teamNumber) {
                return { ...t, rank: newRank };
              }
              if (oldRank < newRank && t.rank > oldRank && t.rank <= newRank) {
                return { ...t, rank: t.rank - 1 };
              }
              if (oldRank > newRank && t.rank >= newRank && t.rank < oldRank) {
                return { ...t, rank: t.rank + 1 };
              }
              return t;
            })
            .sort((a, b) => a.rank - b.rank);
        }
        case "togglePicked": {
          return state.map((t) =>
            t.teamNumber === action.teamNumber ? { ...t, picked: action.picked } : t
          );
        }
        default:
          return state;
      }
    }
  );

  const handleRemove = async (teamNumber: number) => {
    startTransition(() => {
      updateOptimisticTeams({ type: "remove", teamNumber });
    });
    const result = await removeTeamFromPicklist({ picklistId, teamNumber });
    if ("error" in result) {
      console.error("Failed to remove team:", result.error);
    }
    router.refresh();
  };

  const handleReorder = async (teamNumber: number, newRank: number) => {
    startTransition(() => {
      updateOptimisticTeams({ type: "reorder", teamNumber, newRank });
    });
    const result = await reorderPicklistTeam({ picklistId, teamNumber, newRank });
    if ("error" in result) {
      console.error("Failed to reorder team:", result.error);
    }
    router.refresh();
  };

  const handleTogglePicked = async (teamNumber: number, picked: boolean) => {
    startTransition(() => {
      updateOptimisticTeams({ type: "togglePicked", teamNumber, picked });
    });
    const result = await togglePickedStatus({ picklistId, teamNumber, picked });
    if ("error" in result) {
      console.error("Failed to toggle picked status:", result.error);
    }
    router.refresh();
  };

  const toggleColumn = (column: OptionalColumnKey) => {
    setVisibleColumns((current) => ({
      ...current,
      [column]: !current[column],
    }));
  };

  if (optimisticTeams.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="mb-4">No teams added yet. Add a team to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Fields:</span>
        {optionalColumns.map((column) => (
          <Button
            key={column.key}
            type="button"
            size="sm"
            variant={visibleColumns[column.key] ? "secondary" : "outline"}
            className={cn("h-7 px-2 text-xs", !visibleColumns[column.key] && "opacity-70")}
            aria-pressed={visibleColumns[column.key]}
            onClick={() => toggleColumn(column.key)}
          >
            {column.label}
          </Button>
        ))}
      </div>

      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead className="w-12">#</TableHead>
            <TableHead className="w-14">Team</TableHead>
            <TableHead className="w-20">Remove</TableHead>
            <TableHead className="w-20"></TableHead>
            {visibleColumns.name ? <TableHead className="w-32 truncate">Name</TableHead> : null}
            {visibleColumns.avgTotalPoints ? (
              <TableHead className="w-24 text-right">Avg Pts</TableHead>
            ) : null}
            {visibleColumns.climbSuccessPct ? (
              <TableHead className="w-24 text-right">Climb %</TableHead>
            ) : null}
            {visibleColumns.uptimePct ? (
              <TableHead className="w-24 text-right">Uptime %</TableHead>
            ) : null}
            {visibleColumns.matchesScouted ? (
              <TableHead className="w-24 text-right">Matches</TableHead>
            ) : null}
            {visibleColumns.compositeCompatibilityScore ? (
              <TableHead className="w-24 text-right">Compat</TableHead>
            ) : null}
            {visibleColumns.avgDriverWorkability ? (
              <TableHead className="w-24 text-right">Driver Fit</TableHead>
            ) : null}
            {visibleColumns.avgHumanPlayerWorkability ? (
              <TableHead className="w-24 text-right">HP Fit</TableHead>
            ) : null}
            {visibleColumns.submissionCount ? (
              <TableHead className="w-28 text-right">Compat Count</TableHead>
            ) : null}
            {visibleColumns.compatibilityNotes ? (
              <TableHead className="w-28 text-right">Compat Notes</TableHead>
            ) : null}
            {visibleColumns.notes ? <TableHead className="w-32">Notes</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {optimisticTeams.map((team, index) => (
            <TableRow key={team.teamNumber} className={team.picked ? "opacity-50" : ""}>
              <TableCell>
                <PickedCheckbox
                  teamNumber={team.teamNumber}
                  picked={team.picked}
                  onToggle={handleTogglePicked}
                />
              </TableCell>

              <TableCell className="font-mono font-medium">{team.rank}</TableCell>
              <TableCell className={`font-mono font-bold ${team.picked ? "line-through" : ""}`}>
                <Link
                  href={routes.analysis.team(team.teamNumber)}
                  className="text-primary hover:underline"
                >
                  {team.teamNumber}
                </Link>
              </TableCell>
              <TableCell>
                <RemoveTeamButton teamNumber={team.teamNumber} onRemove={handleRemove} />
              </TableCell>
              <TableCell>
                <ReorderButtons
                  teamNumber={team.teamNumber}
                  currentRank={team.rank}
                  isFirst={index === 0}
                  isLast={index === optimisticTeams.length - 1}
                  onReorder={handleReorder}
                />
              </TableCell>
              {visibleColumns.name ? (
                <TableCell className={cn("truncate", team.picked ? "line-through" : "")}>
                  {team.teamName || "—"}
                </TableCell>
              ) : null}
              {visibleColumns.avgTotalPoints ? (
                <TableCell className="text-right tabular-nums">
                  {team.avgTotalPoints !== undefined ? team.avgTotalPoints.toFixed(1) : "—"}
                </TableCell>
              ) : null}
              {visibleColumns.climbSuccessPct ? (
                <TableCell className="text-right tabular-nums">
                  {team.climbSuccessPct !== undefined
                    ? `${Math.round(team.climbSuccessPct)}%`
                    : "—"}
                </TableCell>
              ) : null}
              {visibleColumns.uptimePct ? (
                <TableCell className="text-right tabular-nums">
                  {team.uptimePct !== undefined ? `${Math.round(team.uptimePct)}%` : "—"}
                </TableCell>
              ) : null}
              {visibleColumns.matchesScouted ? (
                <TableCell className="text-right tabular-nums">
                  {team.matchesScouted !== undefined ? team.matchesScouted : "—"}
                </TableCell>
              ) : null}
              {visibleColumns.compositeCompatibilityScore ? (
                <TableCell className="text-right tabular-nums font-medium">
                  {team.compositeCompatibilityScore !== null
                    ? team.compositeCompatibilityScore.toFixed(1)
                    : "—"}
                </TableCell>
              ) : null}
              {visibleColumns.avgDriverWorkability ? (
                <TableCell className="text-right tabular-nums">
                  {team.avgDriverWorkability !== null ? team.avgDriverWorkability.toFixed(1) : "—"}
                </TableCell>
              ) : null}
              {visibleColumns.avgHumanPlayerWorkability ? (
                <TableCell className="text-right tabular-nums">
                  {team.avgHumanPlayerWorkability !== null
                    ? team.avgHumanPlayerWorkability.toFixed(1)
                    : "—"}
                </TableCell>
              ) : null}
              {visibleColumns.submissionCount ? (
                <TableCell className="text-right tabular-nums">
                  {team.submissionCount > 0 ? team.submissionCount : "—"}
                </TableCell>
              ) : null}
              {visibleColumns.compatibilityNotes ? (
                <TableCell className="text-right">
                  <CompatibilityNotesDialog
                    notes={team.compatibilityNotes}
                    noteCount={team.noteCount}
                  />
                </TableCell>
              ) : null}
              {visibleColumns.notes ? (
                <TableCell className="truncate">
                  <NotesCell
                    picklistId={picklistId}
                    teamNumber={team.teamNumber}
                    initialNotes={team.notes}
                  />
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
