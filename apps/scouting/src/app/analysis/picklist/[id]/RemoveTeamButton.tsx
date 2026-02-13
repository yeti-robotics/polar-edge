"use client";

import { Button } from "@repo/ui/components/button";
import { XIcon } from "lucide-react";

interface RemoveTeamButtonProps {
  teamNumber: number;
  onRemove: (teamNumber: number) => void;
}

export function RemoveTeamButton({ teamNumber, onRemove }: RemoveTeamButtonProps) {
  return (
    <Button variant="ghost" size="icon" onClick={() => onRemove(teamNumber)}>
      <XIcon className="size-4" />
    </Button>
  );
}
