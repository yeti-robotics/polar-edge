"use client";

import { Button } from "@repo/ui/components/button";
import { useState } from "react";
import { SubmitDialog } from "./components/SubmitDialog";
import { useActionState } from "./contexts/ActionStateContext";
import { useFormData } from "./contexts/FormDataContext";
import { useNavigation } from "./contexts/NavigationContext";
import { useStandFormActions } from "./hooks/useStandFormActions";
import { STAGES } from "./types";

export function StandFormNavigation() {
  const { state, dispatch } = useNavigation();
  const { state: formData } = useFormData();
  const { state: actionState } = useActionState();
  const { prepareForPhaseTransition } = useStandFormActions();
  const [submitOpen, setSubmitOpen] = useState(false);

  const isOnComments = state.currentStage === "comments";
  const isOnMatchSelection = state.currentStage === "match_selection";
  const isOnAutonomous = state.currentStage === "autonomous";
  const isOnTeleop = state.currentStage === "teleop";

  // Check if there's an active action (timer running)
  const hasActiveAction = actionState.activeAction !== null;

  // Determine if we can progress forward (Next button)
  const getProgressionBlock = () => {
    // Block 1: Active action (shooting/climbing timer) - blocks ALL transitions
    if (hasActiveAction) {
      return "Complete the current action before proceeding";
    }

    // Block 2: Oof state - special rules for forward progression
    if (actionState.isOofed) {
      // From auto: allow forward to teleop
      if (isOnAutonomous) {
        return null; // Allow auto → teleop
      }
      // From anywhere else (including teleop): block forward progression
      return "Cannot progress forward while oofed (end oof time first)";
    }

    // Block 3: Match selection requires teamMatchId
    if (isOnMatchSelection && formData.teamMatchId === null) {
      return "Select a match to continue";
    }

    // Block 4: Comments required (min 32 chars) before submit
    if (isOnComments && formData.comments.trim().length < 32) {
      return "Comments must be at least 32 characters";
    }

    // No blocks - can progress
    return null;
  };

  const progressionBlock = getProgressionBlock();
  const isNextDisabled = progressionBlock !== null;

  const handleNext = () => {
    if (isOnComments) {
      setSubmitOpen(true);
      return;
    }
    // When transitioning from auto to teleop, prepare for phase transition
    if (isOnAutonomous) {
      prepareForPhaseTransition();
    }
    dispatch({ type: "increment_stage" });
  };

  const handleBack = () => {
    // When transitioning from teleop back to auto, prepare for phase transition
    if (isOnTeleop) {
      prepareForPhaseTransition();
    }
    dispatch({ type: "decrement_stage" });
  };

  // Determine if back button should be disabled
  const getBackButtonBlock = () => {
    // Always block back from match selection
    if (isOnMatchSelection) {
      return "Cannot go back from match selection";
    }

    // Block if there's an active action
    if (hasActiveAction) {
      return "Complete the current action before going back";
    }

    // Block if oofed - special rules for backward progression
    if (actionState.isOofed) {
      // From teleop: allow back to auto
      if (isOnTeleop) {
        return null; // Allow teleop → auto
      }
      // From anywhere else (including auto): block backward progression
      return "Cannot go back while oofed (end oof time first)";
    }

    return null;
  };

  const backButtonBlock = getBackButtonBlock();
  const isBackDisabled = backButtonBlock !== null;

  return (
    <>
      <div className="flex w-full justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={handleBack}
          disabled={isBackDisabled}
          title={backButtonBlock || undefined}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={isNextDisabled}
          title={progressionBlock || undefined}
        >
          {isOnComments ? "Submit" : "Next"}
        </Button>
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
