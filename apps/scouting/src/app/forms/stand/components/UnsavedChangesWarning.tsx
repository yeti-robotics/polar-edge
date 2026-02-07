"use client";

import { useEffect } from "react";
import { useFormData } from "../contexts/FormDataContext";

/**
 * Component that adds a beforeunload warning when form has unsaved data.
 * Warns user before leaving page if they have completed cycles, climbs, or comments.
 */
export function UnsavedChangesWarning() {
  const { state } = useFormData();

  useEffect(() => {
    const hasUnsavedData =
      state.completedCycles.length > 0 ||
      state.completedClimbs.length > 0 ||
      state.comments.trim() !== "";

    if (!hasUnsavedData) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers require returnValue to be set
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [state.completedCycles, state.completedClimbs, state.comments]);

  return null;
}
