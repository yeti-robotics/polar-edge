"use client";

import { Button } from "@repo/ui/components/button";
import { Undo2Icon } from "lucide-react";

export function UndoToast({ onUndo }: { onUndo: () => void }) {
  return (
    <div className="absolute bottom-20 left-4 z-40 flex items-center gap-3 rounded-xl border bg-card p-2.5 text-card-foreground shadow-lg">
      <span className="text-sm">Mark deleted</span>
      <Button type="button" size="sm" onClick={onUndo}>
        <Undo2Icon className="size-3.5" />
        Undo
      </Button>
    </div>
  );
}
