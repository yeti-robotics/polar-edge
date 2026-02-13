"use client";

import { Button } from "@repo/ui/components/button";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { reorderPicklistTeam } from "../actions";

interface ReorderButtonsProps {
  picklistId: string;
  teamNumber: number;
  currentRank: number;
  isFirst: boolean;
  isLast: boolean;
}

export function ReorderButtons({
  picklistId,
  teamNumber,
  currentRank,
  isFirst,
  isLast,
}: ReorderButtonsProps) {
  const [isReordering, setIsReordering] = useState(false);
  const router = useRouter();

  const handleReorder = async (newRank: number) => {
    setIsReordering(true);
    const result = await reorderPicklistTeam({ picklistId, teamNumber, newRank });

    if ("error" in result) {
      console.error("Failed to reorder team:", result.error);
      setIsReordering(false);
      return;
    }

    setIsReordering(false);
    router.refresh();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleReorder(currentRank - 1)}
        disabled={isFirst || isReordering}
      >
        <ChevronUpIcon className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleReorder(currentRank + 1)}
        disabled={isLast || isReordering}
      >
        <ChevronDownIcon className="size-4" />
      </Button>
    </>
  );
}
