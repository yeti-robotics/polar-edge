"use client";

import { Button } from "@repo/ui/components/button";
import { STAGES, useStandForm } from "./StandFormProvider";

export function StandFormNavigation() {
  const {
    state: { currentStage },
    dispatch,
  } = useStandForm();

  const isOnComments = currentStage === "comments";
  return (
    <div className="flex w-full justify-between">
      <Button
        variant="secondary"
        onClick={() => dispatch({ type: "decrement_stage" })}
        disabled={currentStage === "match_selection"}
      >
        Back
      </Button>
      <Button onClick={() => dispatch({ type: "increment_stage" })}>
        {isOnComments ? "Submit" : "Next"}
      </Button>
    </div>
  );
}

export function StandFormProgress() {
  const {
    state: { currentStage },
  } = useStandForm();
  return (
    <div className="flex justify-between">
      <div className="flex-1 h-2 bg-neutral-800">
        <div
          className="h-2 rounded-full bg-primary transition-all duration-500"
          style={{
            width: `${(STAGES.indexOf(currentStage) / (STAGES.length - 1)) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
