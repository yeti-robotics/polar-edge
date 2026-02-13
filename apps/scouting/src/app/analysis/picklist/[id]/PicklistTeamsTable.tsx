"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { useRouter } from "next/navigation";
import { startTransition, useOptimistic } from "react";
import { removeTeamFromPicklist, reorderPicklistTeam, togglePickedStatus } from "../actions";
import { PickedCheckbox } from "./PickedCheckbox";
import { RemoveTeamButton } from "./RemoveTeamButton";
import { ReorderButtons } from "./ReorderButtons";

interface Team {
  teamNumber: number;
  rank: number;
  teamName: string;
  picked: boolean;
}

interface PicklistTeamsTableProps {
  picklistId: string;
  initialTeams: Team[];
}

type TeamAction =
  | { type: "remove"; teamNumber: number }
  | { type: "reorder"; teamNumber: number; newRank: number }
  | { type: "togglePicked"; teamNumber: number; picked: boolean };

export function PicklistTeamsTable({ picklistId, initialTeams }: PicklistTeamsTableProps) {
  const router = useRouter();
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

  if (optimisticTeams.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="mb-4">No teams added yet. Add a team to get started.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead className="w-16">#</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="w-32 text-right">Actions</TableHead>
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
              {team.teamNumber}
            </TableCell>
            <TableCell className={team.picked ? "line-through" : ""}>
              {team.teamName || "—"}
            </TableCell>
            <TableCell className="text-right">
              <div className="inline-flex items-center gap-1">
                <ReorderButtons
                  teamNumber={team.teamNumber}
                  currentRank={team.rank}
                  isFirst={index === 0}
                  isLast={index === optimisticTeams.length - 1}
                  onReorder={handleReorder}
                />
                <RemoveTeamButton teamNumber={team.teamNumber} onRemove={handleRemove} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
