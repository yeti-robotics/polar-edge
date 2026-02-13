"use client";

import { Button } from "@repo/ui/components/button";
import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { removeTeamFromPicklist } from "../actions";

interface RemoveTeamButtonProps {
  picklistId: string;
  teamNumber: number;
}

export function RemoveTeamButton({ picklistId, teamNumber }: RemoveTeamButtonProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const router = useRouter();

  const handleRemove = async () => {
    setIsRemoving(true);
    const result = await removeTeamFromPicklist({ picklistId, teamNumber });

    if ("error" in result) {
      console.error("Failed to remove team:", result.error);
      setIsRemoving(false);
      return;
    }

    router.refresh();
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleRemove} disabled={isRemoving}>
      <XIcon className="size-4" />
    </Button>
  );
}
