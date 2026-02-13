"use client";

import { Checkbox } from "@repo/ui/components/checkbox";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { togglePickedStatus } from "../actions";

interface PickedCheckboxProps {
  picklistId: string;
  teamNumber: number;
  picked: boolean;
}

export function PickedCheckbox({ picklistId, teamNumber, picked }: PickedCheckboxProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const handleChange = async (checked: boolean | "indeterminate") => {
    if (checked === "indeterminate") return;

    setIsUpdating(true);
    const result = await togglePickedStatus({
      picklistId,
      teamNumber,
      picked: checked,
    });

    if ("error" in result) {
      console.error("Failed to update picked status:", result.error);
      setIsUpdating(false);
      return;
    }

    setIsUpdating(false);
    router.refresh();
  };

  return (
    <Checkbox
      checked={picked}
      onCheckedChange={handleChange}
      disabled={isUpdating}
      aria-label="Mark as picked"
    />
  );
}
