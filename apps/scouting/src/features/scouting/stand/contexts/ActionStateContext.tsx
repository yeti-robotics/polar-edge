"use client";

import { createContext, useContext, useReducer } from "react";
import type { ActionType, ActiveAction, Phase } from "../types";

// ===== STATE & ACTIONS =====

export type ActionStateContextValue = {
  activeAction: ActiveAction | null;
  isOofed: boolean;
  oofStartedAt: number | null;
  oofCumulativeSeconds: number;
};

export type ActionStateAction =
  | { type: "oof_start" }
  | { type: "oof_end" }
  | { type: "oof_cancel" }
  | { type: "action_start"; payload: { actionType: ActionType; phase: Phase } }
  | { type: "action_cancel" }
  | { type: "action_complete" }
  | { type: "reset_for_phase_transition" }
  | { type: "reset" };

// ===== REDUCER =====

function actionStateReducer(
  state: ActionStateContextValue,
  action: ActionStateAction
): ActionStateContextValue {
  switch (action.type) {
    case "oof_start":
      // Can only start oof if no active action
      if (state.activeAction !== null) {
        console.warn("Cannot start oof while action is active");
        return state;
      }
      return {
        ...state,
        isOofed: true,
        oofStartedAt: Date.now(),
      };

    case "oof_end": {
      if (!state.isOofed) return state;

      const segmentSeconds = state.oofStartedAt
        ? Math.floor((Date.now() - state.oofStartedAt) / 1000)
        : 0;

      return {
        ...state,
        isOofed: false,
        oofStartedAt: null,
        oofCumulativeSeconds: state.oofCumulativeSeconds + segmentSeconds,
      };
    }

    case "oof_cancel":
      // Discard the current oof segment without accumulating time
      if (!state.isOofed) return state;
      return {
        ...state,
        isOofed: false,
        oofStartedAt: null,
      };

    case "action_start":
      // Enforce mutual exclusivity: can't start action if oofed or another action is active
      if (state.isOofed || state.activeAction !== null) {
        console.warn("Cannot start action: already oofed or another action active");
        return state;
      }

      return {
        ...state,
        activeAction: {
          type: action.payload.actionType,
          startedAt: Date.now(),
          phase: action.payload.phase,
        },
      };

    case "action_cancel":
    case "action_complete":
      // Clear active action
      return {
        ...state,
        activeAction: null,
      };

    case "reset_for_phase_transition":
      // When transitioning from auto to teleop:
      // - Clear activeAction (shooting/climbing don't continue across phases)
      // - Preserve oof state (oof time can continue across phases)
      // - Preserve cumulative oof time
      return {
        ...state,
        activeAction: null,
        // Keep isOofed, oofStartedAt, oofCumulativeSeconds unchanged
      };

    case "reset":
      return { activeAction: null, isOofed: false, oofStartedAt: null, oofCumulativeSeconds: 0 };

    default:
      return state;
  }
}

// ===== CONTEXT =====

type ActionStateProviderValue = {
  state: ActionStateContextValue;
  dispatch: (action: ActionStateAction) => void;
};

const ActionStateContext = createContext<ActionStateProviderValue | null>(null);

// ===== PROVIDER =====

export function ActionStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(actionStateReducer, {
    activeAction: null,
    isOofed: false,
    oofStartedAt: null,
    oofCumulativeSeconds: 0,
  });

  return (
    <ActionStateContext.Provider value={{ state, dispatch }}>
      {children}
    </ActionStateContext.Provider>
  );
}

// ===== HOOK =====

export function useActionState() {
  const context = useContext(ActionStateContext);
  if (!context) {
    throw new Error("useActionState must be used within ActionStateProvider");
  }
  return context;
}
