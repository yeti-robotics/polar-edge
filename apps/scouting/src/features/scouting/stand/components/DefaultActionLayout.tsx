"use client";

import { Button } from "@repo/ui/components/button";
import { useStandFormActions } from "../hooks/useStandFormActions";
import { OofTimeButton } from "./OofTimeButton";

/**
 * Default layout showing all action start options.
 * Shooting is the primary action (large, full-width button).
 * Oof and climbing are secondary actions (smaller buttons below).
 */
export function DefaultActionLayout() {
  const { startAction } = useStandFormActions();

  return (
    <div className="flex flex-col gap-4 py-4 min-h-[280px]">
      {/* Primary action: Shooting */}
      <Button
        size="lg"
        className="w-full h-24 text-xl font-semibold"
        onClick={() => startAction("shooting")}
      >
        Start Shooting
      </Button>

      {/* Secondary actions: Oof and Climb */}
      <div className="grid grid-cols-2 gap-4 h-24">
        <OofTimeButton />
        <Button
          variant="secondary"
          size="lg"
          className="h-full w-full"
          onClick={() => startAction("climbing")}
        >
          Start Climb
        </Button>
      </div>
    </div>
  );
}
