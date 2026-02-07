"use client";

import { Button } from "@repo/ui/components/button";
import { useFormData } from "./contexts/FormDataContext";
import { useNavigation } from "./contexts/NavigationContext";
import { useStandFormActions } from "./hooks/useStandFormActions";
import { STAGES } from "./types";

export function StandFormNavigation() {
  const { state, dispatch } = useNavigation();
  const { state: formData } = useFormData();
  const { prepareForPhaseTransition } = useStandFormActions();

  const isOnComments = state.currentStage === "comments";
  const isOnMatchSelection = state.currentStage === "match_selection";

  // Disable next button on match selection if no teamMatchId
  const isNextDisabled = isOnMatchSelection && formData.teamMatchId === null;

  const handleNext = () => {
    // When transitioning from auto to teleop, prepare for phase transition
    if (state.currentStage === "autonomous") {
      prepareForPhaseTransition();
    }
    dispatch({ type: "increment_stage" });
  };

  return (
    <div className="flex w-full justify-between">
      <Button
        variant="secondary"
        onClick={() => dispatch({ type: "decrement_stage" })}
        disabled={isOnMatchSelection}
      >
        Back
      </Button>
      <Button onClick={handleNext} disabled={isNextDisabled}>
        {isOnComments ? "Submit" : "Next"}
      </Button>
    </div>
  );
}

export function StandFormProgress() {
  const { state } = useNavigation();
  return (
    <div className="mb-4">
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-200 ease-in-out"
          style={{
            width: `${(STAGES.indexOf(state.currentStage) / (STAGES.length - 1)) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
