"use client";

import { Button } from "@repo/ui/components/button";
import { CheckCircleIcon, XIcon } from "lucide-react";
import { useActionState } from "../contexts/ActionStateContext";
import { useElapsedTime } from "../hooks/useElapsedTime";
import { useStandFormActions } from "../hooks/useStandFormActions";

/**
 * Active shooting layout with large timer and end/cancel buttons.
 * Displayed when a shooting action is in progress.
 */
export function ShootingActiveLayout() {
  const { state: actionState } = useActionState();
  const { cancelAction, completeShootingCycle } = useStandFormActions();
  const elapsedSeconds = useElapsedTime(actionState.activeAction?.startedAt ?? null);

  return (
    <div className="flex flex-col items-center gap-4 py-4 min-h-[280px]">
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="text-6xl font-bold tabular-nums animate-pulse">{elapsedSeconds}s</div>
        <div className="text-lg text-muted-foreground">Shooting</div>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full h-24">
        <Button variant="outline" className="h-full" onClick={cancelAction}>
          <XIcon className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button variant="default" className="h-full" onClick={() => completeShootingCycle()}>
          <CheckCircleIcon className="mr-2 h-5 w-5" />
          End Shoot
        </Button>
      </div>
    </div>
  );
}
