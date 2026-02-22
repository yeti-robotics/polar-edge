"use client";

import { createContext, useContext, useReducer } from "react";
import { STAGES, type StandFormStage } from "../types";

// ===== STATE & ACTIONS =====

export type NavigationState = {
  currentStage: StandFormStage;
};

export type NavigationAction =
  | { type: "increment_stage" }
  | { type: "decrement_stage" }
  | { type: "set_stage"; payload: StandFormStage }
  | { type: "reset" };

// ===== REDUCER =====

function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case "increment_stage": {
      const currentIndex = STAGES.indexOf(state.currentStage);
      const nextIndex = Math.min(currentIndex + 1, STAGES.length - 1);
      return {
        ...state,
        currentStage: STAGES[nextIndex] as StandFormStage,
      };
    }

    case "decrement_stage": {
      const currentIndex = STAGES.indexOf(state.currentStage);
      const prevIndex = Math.max(currentIndex - 1, 0);
      return {
        ...state,
        currentStage: STAGES[prevIndex] as StandFormStage,
      };
    }

    case "set_stage":
      return {
        ...state,
        currentStage: action.payload,
      };

    case "reset":
      return { currentStage: "match_selection" };

    default:
      return state;
  }
}

// ===== CONTEXT =====

type NavigationContextValue = {
  state: NavigationState;
  dispatch: (action: NavigationAction) => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

// ===== PROVIDER =====

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(navigationReducer, {
    currentStage: "match_selection",
  });

  return (
    <NavigationContext.Provider value={{ state, dispatch }}>{children}</NavigationContext.Provider>
  );
}

// ===== HOOK =====

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
}
