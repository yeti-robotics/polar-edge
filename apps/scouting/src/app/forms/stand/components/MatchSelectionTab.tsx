"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { useState } from "react";
import { useFormData } from "../contexts/FormDataContext";
import { lookupTeamMatch } from "../actions";

/**
 * Match selection tab with team match lookup.
 * Allows user to enter match number and team number, then lookup teamMatchId.
 */
export function MatchSelectionTab() {
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
        dispatch({ type: "set_team_match_id", payload: result.teamMatchId });
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
      <h2 className="text-lg font-semibold text-foreground">Match Selection</h2>
      <div className="space-y-4">
        <Input
          type="number"
          id="match_number"
          name="match_number"
          placeholder="Enter Match Number"
          value={matchNumber}
          onChange={(e) => setMatchNumber(e.target.value)}
        />
        <Input
          type="number"
          id="team_number"
          name="team_number"
          placeholder="Enter Team Number"
          value={teamNumber}
          onChange={(e) => setTeamNumber(e.target.value)}
        />

        <Button
          onClick={handleLookup}
          disabled={loading || !matchNumber || !teamNumber}
          className="w-full"
        >
          {loading ? "Looking up..." : "Lookup Match"}
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {state.teamMatchId && (
          <p className="text-sm text-green-600">
            ✓ Match found (ID: {state.teamMatchId})
          </p>
        )}
      </div>
    </div>
  );
}
