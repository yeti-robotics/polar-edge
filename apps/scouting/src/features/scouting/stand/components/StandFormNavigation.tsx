"use client";

import { Button } from "@repo/ui/components/button";
import { useState } from "react";
import { useFormData } from "../contexts/FormDataContext";
import { useMatchTimer } from "../contexts/MatchTimerContext";
import { useNavigation } from "../contexts/NavigationContext";
import { COMMENTS_MIN_LENGTH, STAGES } from "../types";
import { SubmitDialog } from "./SubmitDialog";

export function StandFormNavigation() {
  const { state, dispatch } = useNavigation();
  const { state: formData } = useFormData();
  const { dispatch: dispatchTimer } = useMatchTimer();
  const [submitOpen, setSubmitOpen] = useState(false);

  const isOnComments = state.currentStage === "comments";
  const isOnMatchSelection = state.currentStage === "match_selection";

  const handleStartMatch = () => {
    dispatchTimer({ type: "start_match" });
    dispatch({ type: "increment_stage" });
  };

  const isSubmitDisabled = formData.comments.trim().length < COMMENTS_MIN_LENGTH;
  const isStartDisabled = formData.teamMatchId === null;

  return (
    <>
      <div className="flex w-full justify-end">
        {isOnMatchSelection && (
          <Button
            type="button"
            onClick={handleStartMatch}
            disabled={isStartDisabled}
            title={isStartDisabled ? "Select a match to continue" : undefined}
          >
            Start Match
          </Button>
        )}

        {isOnComments && (
          <Button
            type="button"
            onClick={() => setSubmitOpen(true)}
            disabled={isSubmitDisabled}
            title={
              isSubmitDisabled
                ? `Comments must be at least ${COMMENTS_MIN_LENGTH} characters`
                : undefined
            }
          >
            Submit
          </Button>
        )}
      </div>

      <SubmitDialog open={submitOpen} onClose={() => setSubmitOpen(false)} />
    </>
  );
}

export function StandFormProgress() {
  const { state } = useNavigation();
  const index = STAGES.indexOf(state.currentStage);
  return (
    <div className="mb-4">
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-200 ease-in-out"
          style={{
            width: `${(index / (STAGES.length - 1)) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
