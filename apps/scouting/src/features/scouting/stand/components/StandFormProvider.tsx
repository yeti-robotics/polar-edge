"use client";

import { ActionStateProvider } from "../contexts/ActionStateContext";
import { FormDataProvider } from "../contexts/FormDataContext";
import { NavigationProvider } from "../contexts/NavigationContext";

/**
 * Split context architecture for performance optimization.
 * - NavigationProvider: manages currentStage (changes occasionally)
 * - ActionStateProvider: manages activeAction, isOofed, timing (changes frequently)
 * - FormDataProvider: manages completedCycles, completedClimbs, etc (changes rarely)
 */
export function StandFormProvider({ children }: { children: React.ReactNode }) {
  return (
    <NavigationProvider>
      <ActionStateProvider>
        <FormDataProvider>{children}</FormDataProvider>
      </ActionStateProvider>
    </NavigationProvider>
  );
}

// Re-export stage constants for backward compatibility
export { STAGES, type StandFormStage } from "../types";
