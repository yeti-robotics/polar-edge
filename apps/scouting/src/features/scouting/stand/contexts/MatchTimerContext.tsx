"use client";

import { createContext, useContext, useReducer } from "react";

// ===== CONSTANTS =====

export const AUTO_DURATION_SECONDS = 20;
export const AUTO_TRANSITION_DELAY_SECONDS = 3;
export const TELEOP_DURATION_SECONDS = 140;
export const TELEOP_START_SECONDS = AUTO_DURATION_SECONDS + AUTO_TRANSITION_DELAY_SECONDS;
export const MATCH_DURATION_SECONDS = TELEOP_START_SECONDS + TELEOP_DURATION_SECONDS;

// ===== STATE & ACTIONS =====

export type MatchTimerState = {
  matchStartedAt: number | null;
  autoTransitionComplete: boolean;
  teleopTransitionComplete: boolean;
};

export type MatchTimerAction =
  | { type: "start_match" }
  | { type: "complete_auto_transition" }
  | { type: "complete_teleop_transition" }
  | { type: "reset" };

// ===== REDUCER =====

function matchTimerReducer(state: MatchTimerState, action: MatchTimerAction): MatchTimerState {
  switch (action.type) {
    case "start_match":
      if (state.matchStartedAt !== null) return state;
      return { ...state, matchStartedAt: Date.now() };
    case "complete_auto_transition":
      return { ...state, autoTransitionComplete: true };
    case "complete_teleop_transition":
      return { ...state, teleopTransitionComplete: true };
    case "reset":
      return {
        matchStartedAt: null,
        autoTransitionComplete: false,
        teleopTransitionComplete: false,
      };
    default:
      return state;
  }
}

// ===== CONTEXT =====

type MatchTimerContextValue = {
  state: MatchTimerState;
  dispatch: (action: MatchTimerAction) => void;
};

const MatchTimerContext = createContext<MatchTimerContextValue | null>(null);

// ===== PROVIDER =====

export function MatchTimerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(matchTimerReducer, {
    matchStartedAt: null,
    autoTransitionComplete: false,
    teleopTransitionComplete: false,
  });

  return (
    <MatchTimerContext.Provider value={{ state, dispatch }}>{children}</MatchTimerContext.Provider>
  );
}

// ===== HOOK =====

export function useMatchTimer() {
  const context = useContext(MatchTimerContext);
  if (!context) {
    throw new Error("useMatchTimer must be used within MatchTimerProvider");
  }
  return context;
}
