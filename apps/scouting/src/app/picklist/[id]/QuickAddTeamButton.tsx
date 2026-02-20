"use client";

import { Button } from "@repo/ui/components/button";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useOptimistic } from "react";
import { addTeamToPicklist } from "../actions";

interface QuickAddTeamButtonProps {
  picklistId: string;
  teamNumber: number;
  rank: number;
}

export function QuickAddTeamButton({ picklistId, teamNumber, rank }: QuickAddTeamButtonProps) {
  const router = useRouter();
  const [optimisticAdded, setOptimisticAdded] = useOptimistic(false, () => true);

  const handleAdd = async () => {
    startTransition(() => {
      setOptimisticAdded(true);
    });

    const result = await addTeamToPicklist({
      picklistId,
      teamNumber,
      rank,
    });

    if ("error" in result) {
      console.error("Failed to add team:", result.error);
    }

    router.refresh();
  };

  if (optimisticAdded) {
    return <span className="text-sm text-muted-foreground">Adding...</span>;
  }

  return (
    <Button variant="ghost" size="icon-sm" onClick={handleAdd}>
      <PlusIcon className="size-4" />
    </Button>
  );
}
