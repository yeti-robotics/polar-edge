"use client";

import { Button } from "@repo/ui/components/button";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addTeamToPicklist } from "../actions";

interface QuickAddTeamButtonProps {
  picklistId: string;
  teamNumber: number;
  rank: number;
}

export function QuickAddTeamButton({ picklistId, teamNumber, rank }: QuickAddTeamButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();

  const handleAdd = async () => {
    setIsAdding(true);

    // Add to the end of the picklist
    const result = await addTeamToPicklist({
      picklistId,
      teamNumber,
      rank,
    });

    if ("error" in result) {
      console.error("Failed to add team:", result.error);
      setIsAdding(false);
      return;
    }

    router.refresh();
  };

  return (
    <Button variant="ghost" size="icon-sm" onClick={handleAdd} disabled={isAdding}>
      <PlusIcon className="size-4" />
    </Button>
  );
}
