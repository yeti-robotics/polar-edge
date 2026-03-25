"use client";

import { ScoutingLabel } from "@/components/ShowStandFormLabel";
import { useFormData } from "../contexts/FormDataContext";

export function StandFormScoutingLabel() {
  const { state } = useFormData();

  return (
    <ScoutingLabel
      teamNumber={state.teamNumber ?? undefined}
      matchNumber={state.matchNumber ?? undefined}
    />
  );
}
