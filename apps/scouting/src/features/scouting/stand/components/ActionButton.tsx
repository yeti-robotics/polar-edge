"use client";

import { Button } from "@repo/ui/components/button";
import type { ReactNode } from "react";

type ActionButtonState = "idle" | "active" | "disabled";

type ActionButtonProps = {
  state: ActionButtonState;
  onClick: () => void;
  children: ReactNode;
  variant?: "default" | "secondary" | "destructive";
  className?: string;
  elapsedSeconds?: number;
};

/**
 * Base button component with visual state transitions.
 * - idle: normal appearance
 * - active: ring animation, shows elapsed time
 * - disabled: opacity reduced, pointer-events disabled (no layout shift)
 */
export function ActionButton({
  state,
  onClick,
  children,
  variant = "default",
  className = "",
  elapsedSeconds,
}: ActionButtonProps) {
  const isDisabled = state === "disabled";
  const isActive = state === "active";

  // Build classes for state transitions
  const stateClasses =
    state === "disabled"
      ? "opacity-40 pointer-events-none transition-all duration-300"
      : state === "active"
        ? "ring-2 ring-primary ring-offset-2 transition-all duration-300"
        : "transition-all duration-300";

  return (
    <Button
      variant={variant}
      className={`${className} ${stateClasses}`}
      onClick={onClick}
      disabled={isDisabled}
    >
      {isActive && elapsedSeconds !== undefined ? (
        <span className="animate-pulse">
          {children} ({elapsedSeconds}s)
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
