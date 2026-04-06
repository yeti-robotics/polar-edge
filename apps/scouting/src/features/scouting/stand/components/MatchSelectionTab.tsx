"use client";

import { Button } from "@repo/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { TypographyH4 } from "@repo/ui/components/typography";
import { useState } from "react";
import { lookupTeamMatch } from "../actions";
import { useFormData } from "../contexts/FormDataContext";

/**
 * Match selection tab with team match lookup.
 * Allows user to select match number and team number, then lookup teamMatchId.
 */
export function MatchSelectionTab({
  matchOptions,
  teamOptions,
}: {
  matchOptions: number[];
  teamOptions: { teamNumber: number; teamName: string }[];
}) {
  const { state, dispatch } = useFormData();
  const [matchNumber, setMatchNumber] = useState("");
  const [teamNumber, setTeamNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!matchNumber || !teamNumber) {
      setError("Please enter both match number and team number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await lookupTeamMatch(parseInt(matchNumber, 10), parseInt(teamNumber, 10));

      if (result.error) {
        setError(result.error);
      } else if (result.teamMatchId) {
        dispatch({
          type: "set_team_match_id",
          payload: {
            teamMatchId: result.teamMatchId,
            matchNumber: parseInt(matchNumber, 10),
            teamNumber: parseInt(teamNumber, 10),
          },
        });
      } else {
        setError("Team match not found");
      }
    } catch (err) {
      setError("Failed to lookup match. Please try again.");
      console.error("Lookup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <TypographyH4>Match Selection</TypographyH4>
      <div className="space-y-4">
        <Select value={matchNumber} onValueChange={(val) => setMatchNumber(val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Match" />
          </SelectTrigger>
          <SelectContent>
            {matchOptions.map((match) => (
              <SelectItem key={match} value={String(match)}>
                Match {match}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={teamNumber} onValueChange={(val) => setTeamNumber(val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Team" />
          </SelectTrigger>
          <SelectContent>
            {teamOptions.map((team) => (
              <SelectItem key={team.teamNumber} value={String(team.teamNumber)}>
                {team.teamNumber} {team.teamName ? `- ${team.teamName}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleLookup}
          disabled={loading || !matchNumber || !teamNumber}
          className="w-full"
        >
          {loading ? "Looking up..." : "Lookup Match"}
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {state.teamMatchId && (
          <p className="text-sm text-green-600">✓ Match found (ID: {state.teamMatchId})</p>
        )}
      </div>
    </div>
  );
}
