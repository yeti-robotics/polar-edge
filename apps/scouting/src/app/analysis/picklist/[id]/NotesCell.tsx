"use client";

import { startTransition, useEffect, useOptimistic, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updatePicklistTeamNotes } from "../actions";

interface NotesCellProps {
  picklistId: string;
  teamNumber: number;
  initialNotes: string;
}

export function NotesCell({ picklistId, teamNumber, initialNotes }: NotesCellProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialNotes);
  const [optimisticNotes, setOptimisticNotes] = useOptimistic(initialNotes, (_, newNotes: string) => newNotes);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (value === initialNotes) {
      setIsEditing(false);
      return;
    }

    setIsEditing(false);
    startTransition(() => {
      setOptimisticNotes(value);
    });

    const result = await updatePicklistTeamNotes({
      picklistId,
      teamNumber,
      notes: value,
    });

    if ("error" in result) {
      console.error("Failed to update notes:", result.error);
      setValue(initialNotes);
    }

    router.refresh();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setValue(initialNotes);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Team notes"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="w-full text-left px-2 py-1 text-sm hover:bg-muted/50 rounded min-h-8"
      aria-label={optimisticNotes ? "Edit notes" : "Add notes"}
    >
      {optimisticNotes || <span className="text-muted-foreground italic">Add notes...</span>}
    </button>
  );
}
