"use client";

import { useActionState } from "../contexts/ActionStateContext";
import type { ActionType } from "../types";

export type ButtonStates = {
  shooting: {
    canStart: boolean;
    canEnd: boolean;
    canCancel: boolean;
    isActive: boolean;
  };
  climbing: {
    canStart: boolean;
    canEnd: boolean;
    canCancel: boolean;
    isActive: boolean;
  };
  oof: {
    canStart: boolean;
    canEnd: boolean;
  };
};

/**
 * Computes button enable/disable state based on action state machine rules.
 *
 * State machine rules:
 * - Only ONE action can be active at a time (shooting, climbing, or oof)
 * - Start buttons disabled when isOofed or another action is active
 * - End/Cancel buttons only enabled when corresponding action is active
 */
export function useButtonStates(): ButtonStates {
  const { state } = useActionState();
  const { activeAction, isOofed } = state;

  const getActionStates = (actionType: ActionType) => {
    const isThisActionActive = activeAction?.type === actionType;
    const canStart = !isOofed && activeAction === null;
    const canEnd = isThisActionActive;
    const canCancel = isThisActionActive;

    return {
      canStart,
      canEnd,
      canCancel,
      isActive: isThisActionActive,
    };
  };

  return {
    shooting: getActionStates("shooting"),
    climbing: getActionStates("climbing"),
    oof: {
      canStart: !isOofed && activeAction === null,
      canEnd: isOofed,
    },
  };
}
