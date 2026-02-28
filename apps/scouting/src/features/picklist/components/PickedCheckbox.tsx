"use client";

import { Checkbox } from "@repo/ui/components/checkbox";

interface PickedCheckboxProps {
  teamNumber: number;
  picked: boolean;
  onToggle: (teamNumber: number, picked: boolean) => void;
}

export function PickedCheckbox({ teamNumber, picked, onToggle }: PickedCheckboxProps) {
  const handleChange = (checked: boolean | "indeterminate") => {
    if (checked === "indeterminate") return;
    onToggle(teamNumber, checked);
  };

  return <Checkbox checked={picked} onCheckedChange={handleChange} aria-label="Mark as picked" />;
}
