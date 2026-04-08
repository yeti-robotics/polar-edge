"use client";

import { ActionStateProvider } from "../contexts/ActionStateContext";
import { FormDataProvider } from "../contexts/FormDataContext";
import { MatchTimerProvider } from "../contexts/MatchTimerContext";
import { NavigationProvider } from "../contexts/NavigationContext";

/**
 * Split context architecture for performance optimization.
 * - NavigationProvider: manages currentStage (changes occasionally)
 * - ActionStateProvider: manages activeAction, isOofed, timing (changes frequently)
 * - FormDataProvider: manages completedCycles, completedClimbs, etc (changes rarely)
 * - MatchTimerProvider: manages match clock for auto phase transitions (changes once)
 */
export function StandFormProvider({ children }: { children: React.ReactNode }) {
  return (
    <NavigationProvider>
      <ActionStateProvider>
        <FormDataProvider>
          <MatchTimerProvider>{children}</MatchTimerProvider>
        </FormDataProvider>
      </ActionStateProvider>
    </NavigationProvider>
  );
}

// Re-export stage constants for backward compatibility
export { STAGES, type StandFormStage } from "../types";
