"use client";

import { Button } from "@repo/ui/components/button";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { useActionState } from "../contexts/ActionStateContext";
import { useElapsedTime } from "../hooks/useElapsedTime";
import { useStandFormActions } from "../hooks/useStandFormActions";
import { EndClimbDialog } from "./EndClimbDialog";

/**
 * Active climbing layout with large timer and end/cancel buttons.
 * Displayed when a climbing action is in progress.
 */
export function ClimbingActiveLayout() {
  const { state: actionState } = useActionState();
  const { cancelAction, completeClimb } = useStandFormActions();
  const [dialogOpenedAt, setDialogOpenedAt] = useState<number | null>(null);
  const elapsedSeconds = useElapsedTime(actionState.activeAction?.startedAt ?? null, dialogOpenedAt);

  const handleDialogOpen = () => setDialogOpenedAt(Date.now());
  const handleDialogCancel = () => setDialogOpenedAt(null);
  const handleComplete = (climbLevel: number, climbSuccess: boolean) => {
    completeClimb(climbLevel, climbSuccess, dialogOpenedAt ?? undefined);
    setDialogOpenedAt(null);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4 min-h-[280px]">
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="text-6xl font-bold tabular-nums animate-pulse">{elapsedSeconds}s</div>
        <div className="text-lg text-muted-foreground">Climbing</div>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full h-24">
        <Button variant="outline" className="h-full" onClick={cancelAction}>
          <XIcon className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <EndClimbDialog
          onComplete={handleComplete}
          onOpen={handleDialogOpen}
          onCancel={handleDialogCancel}
        />
      </div>
    </div>
  );
}
