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
    <div className="flex min-h-[280px] flex-col gap-4 py-4">
    <Button variant="default" size="lg" className="h-24 w-full text-xl font-semibold" onClick={() => completeShootingCycle()}>
      <CheckCircleIcon className="mr-2 h-5 w-5" />
      End Shoot
    </Button>

    <div className="flex flex-col items-center justify-center gap-2">
      <div className="animate-pulse text-6xl font-bold tabular-nums">
        {elapsedSeconds}s
      </div>
      <div className="text-lg text-muted-foreground">Shooting</div>
    </div>

    <Button variant="destructive" size="lg" className="mt-4 h-16 w-full" onClick={cancelAction}>
      <XIcon className="mr-2 h-4 w-4" />
      Cancel
    </Button>
  </div>
  );
}
