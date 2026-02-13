"use client";

import { Button } from "@repo/ui/components/button";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

interface ReorderButtonsProps {
  teamNumber: number;
  currentRank: number;
  isFirst: boolean;
  isLast: boolean;
  onReorder: (teamNumber: number, newRank: number) => void;
}

export function ReorderButtons({
  teamNumber,
  currentRank,
  isFirst,
  isLast,
  onReorder,
}: ReorderButtonsProps) {
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onReorder(teamNumber, currentRank - 1)}
        disabled={isFirst}
      >
        <ChevronUpIcon className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onReorder(teamNumber, currentRank + 1)}
        disabled={isLast}
      >
        <ChevronDownIcon className="size-4" />
      </Button>
    </>
  );
}
