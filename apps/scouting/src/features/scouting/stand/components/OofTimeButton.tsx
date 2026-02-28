"use client";

import { Button } from "@repo/ui/components/button";
import { useActionState } from "../contexts/ActionStateContext";

/**
 * Button to start oof time tracking.
 * Only shows the start state - active state is handled by OofActiveLayout.
 * Shows cumulative total if there's any accumulated oof time.
 */
export function OofTimeButton() {
  const { state, dispatch } = useActionState();
  const { oofCumulativeSeconds } = state;

  return (
    <Button
      variant="secondary"
      size="lg"
      className="h-full"
      onClick={() => dispatch({ type: "oof_start" })}
    >
      <div className="flex flex-col items-center justify-center gap-1">
        <span>Start Oof</span>
        {oofCumulativeSeconds > 0 && (
          <span className="text-xs opacity-70">{oofCumulativeSeconds}s total</span>
        )}
      </div>
    </Button>
  );
}
