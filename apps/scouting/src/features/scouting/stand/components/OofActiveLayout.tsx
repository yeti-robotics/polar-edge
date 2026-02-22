"use client";

import { Button } from "@repo/ui/components/button";
import { CheckCircleIcon, XIcon } from "lucide-react";
import { useActionState } from "../contexts/ActionStateContext";
import { useElapsedTime } from "../hooks/useElapsedTime";

/**
 * Active oof layout with large timer, cumulative total, and end/cancel buttons.
 * Displayed when oof time is being tracked.
 */
export function OofActiveLayout() {
  const { state: actionState, dispatch } = useActionState();
  const elapsedSeconds = useElapsedTime(actionState.oofStartedAt);
  const totalSeconds = actionState.oofCumulativeSeconds + elapsedSeconds;

  const handleEndOof = () => {
    dispatch({ type: "oof_end" });
  };

  const handleCancelOof = () => {
    dispatch({ type: "oof_cancel" });
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4 min-h-[280px]">
      <div className="flex flex-col items-center justify-center gap-2">
        <div>
          <div className="text-6xl font-bold tabular-nums animate-pulse">{elapsedSeconds}s</div>
        </div>
        <div className="text-lg text-muted-foreground">Total: {totalSeconds}s</div>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full h-24">
        <Button variant="outline" className="h-full" onClick={handleCancelOof}>
          <XIcon className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button variant="default" className="h-full" onClick={handleEndOof}>
          <CheckCircleIcon className="mr-2 h-5 w-5" />
          End Oof Time
        </Button>
      </div>
    </div>
  );
}
