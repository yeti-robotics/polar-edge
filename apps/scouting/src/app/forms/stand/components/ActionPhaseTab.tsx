"use client";

import { useActionState } from "../contexts/ActionStateContext";
import type { Phase } from "../types";
import { ClimbingActiveLayout } from "./ClimbingActiveLayout";
import { DefaultActionLayout } from "./DefaultActionLayout";
import { OofActiveLayout } from "./OofActiveLayout";
import { ShootingActiveLayout } from "./ShootingActiveLayout";

type ActionPhaseTabProps = {
  phase: Phase;
};

/**
 * Shared component for autonomous and teleop phases.
 * Dynamically renders different layouts based on current state with smooth crossfade transitions:
 * - Default: oof toggle + shoot/climb start buttons
 * - Oof: large timer + end button
 * - Shooting: large timer + end/cancel
 * - Climbing: large timer + end/cancel
 */
export function ActionPhaseTab({ phase }: ActionPhaseTabProps) {
  const { state: actionState } = useActionState();
  const { activeAction, isOofed } = actionState;

  // Determine which layout should be visible
  const showDefault = !isOofed && activeAction === null;
  const showOof = isOofed;
  const showShooting = activeAction?.type === "shooting";
  const showClimbing = activeAction?.type === "climbing";

  return (
    <div className="space-y-2">
      <h2 className="text-lg text-foreground">{phase === "auto" ? "Autonomous" : "Teleop"}</h2>

      {/* Render all layouts simultaneously, use CSS transitions for smooth crossfade */}
      <div className="relative min-h-[280px]">
        <LayoutWrapper isVisible={showDefault}>
          <DefaultActionLayout />
        </LayoutWrapper>
        <LayoutWrapper isVisible={showOof}>
          <OofActiveLayout />
        </LayoutWrapper>
        <LayoutWrapper isVisible={showShooting}>
          <ShootingActiveLayout />
        </LayoutWrapper>
        <LayoutWrapper isVisible={showClimbing}>
          <ClimbingActiveLayout />
        </LayoutWrapper>
      </div>
    </div>
  );
}

/**
 * Wrapper component that handles smooth show/hide transitions.
 * All layouts are in the DOM but only the visible one is interactive.
 * Uses ease-out for entering/exiting elements per animations.dev guidelines.
 */
function LayoutWrapper({ isVisible, children }: { isVisible: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`
        transition-opacity duration-200 ease-out
        ${isVisible ? "opacity-100 relative z-10" : "opacity-0 absolute inset-0 z-0 pointer-events-none"}
      `}
    >
      {children}
    </div>
  );
}
