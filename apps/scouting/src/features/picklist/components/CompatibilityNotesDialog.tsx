"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { MessageSquareTextIcon } from "lucide-react";
import { WORKABILITY_ROLE_LABELS, type WorkabilityNote } from "@/features/scouting/workability/types";

interface CompatibilityNotesDialogProps {
  notes: WorkabilityNote[];
  noteCount: number;
}

function formatUpdatedAt(updatedAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(updatedAt));
}

export function CompatibilityNotesDialog({
  notes,
  noteCount,
}: CompatibilityNotesDialogProps) {
  if (noteCount === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs">
          <MessageSquareTextIcon className="size-3.5" />
          {noteCount} {noteCount === 1 ? "note" : "notes"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compatibility Notes</DialogTitle>
          <DialogDescription>
            Recent driver and human-player workability notes for this team.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-2">
          {notes.map((note, index) => (
            <div key={`${note.role}-${note.updatedAt}-${index}`} className="rounded-lg border p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{WORKABILITY_ROLE_LABELS[note.role]}</Badge>
                {note.authorName ? (
                  <span className="text-sm font-medium">{note.authorName}</span>
                ) : null}
                <span className="text-xs text-muted-foreground">
                  {formatUpdatedAt(note.updatedAt)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{note.note}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
