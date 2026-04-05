"use client";

import { useActionState } from "../contexts/ActionStateContext";
import { useFormData } from "../contexts/FormDataContext";
import { useNavigation } from "../contexts/NavigationContext";
import type { ActionType, Phase } from "../types";

/**
 * Coordinator hook for cross-context actions.
 * Implements complex actions that span multiple contexts.
 */
export function useStandFormActions() {
  const { state: actionState, dispatch: dispatchActionState } = useActionState();
  const { state: formData, dispatch: dispatchFormData } = useFormData();
  const { state: navigationState } = useNavigation();

  // Get current phase from navigation stage
  const getCurrentPhase = (): Phase => {
    if (navigationState.currentStage === "autonomous") return "auto";
    if (navigationState.currentStage === "teleop") return "teleop";
    // Default to auto for other stages (shouldn't happen in normal flow)
    return "auto";
  };

  /**
   * Start an action (shooting or climbing).
   * Dispatches to ActionState context with current phase.
   */
  const startAction = (actionType: ActionType) => {
    const phase = getCurrentPhase();
    dispatchActionState({
      type: "action_start",
      payload: { actionType, phase },
    });
  };

  /**
   * Cancel the active action without recording it.
   */
  const cancelAction = () => {
    dispatchActionState({ type: "action_cancel" });
  };

  /**
   * Complete a shooting cycle.
   * Updates both ActionState (clears activeAction) and FormData (adds cycle).
   * BPS is derived from TBA COPRs, not manual bucket selection.
   */
  const completeShootingCycle = (endedAt?: number) => {
    if (!actionState.activeAction || actionState.activeAction.type !== "shooting") {
      console.warn("Cannot complete shooting cycle: no active shooting action");
      return;
    }

    const activeAction = actionState.activeAction;
    const resolvedEndedAt = endedAt ?? Date.now();
    const cycleNumber =
      formData.completedCycles.filter((c) => c.phase === activeAction.phase).length + 1;

    // Add to FormData
    dispatchFormData({
      type: "add_cycle",
      payload: {
        phase: activeAction.phase,
        cycleNumber,
        startedAt: activeAction.startedAt,
        endedAt: resolvedEndedAt,
      },
    });

    // Clear active action
    dispatchActionState({ type: "action_complete" });
  };

  /**
   * Complete a climb with level and success status.
   * Updates both ActionState (clears activeAction) and FormData (adds climb).
   */
  const completeClimb = (climbLevel: number, climbSuccess: boolean, endedAt?: number) => {
    if (!actionState.activeAction || actionState.activeAction.type !== "climbing") {
      console.warn("Cannot complete climb: no active climbing action");
      return;
    }

    const resolvedEndedAt = endedAt ?? Date.now();

    // Add to FormData
    dispatchFormData({
      type: "add_climb",
      payload: {
        phase: actionState.activeAction.phase,
        startedAt: actionState.activeAction.startedAt,
        endedAt: resolvedEndedAt,
        climbLevel,
        climbSuccess,
      },
    });

    // Clear active action
    dispatchActionState({ type: "action_complete" });
  };

  /**
   * Prepare for phase transition (auto -> teleop).
   * Clears active action and oof state, preserves cumulative oof time.
   */
  const prepareForPhaseTransition = () => {
    dispatchActionState({ type: "reset_for_phase_transition" });
  };

  return {
    startAction,
    cancelAction,
    completeShootingCycle,
    completeClimb,
    prepareForPhaseTransition,
    getCurrentPhase,
  };
}
