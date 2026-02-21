"use client";

import { createContext, useContext, useReducer } from "react";
import type { CompletedClimb, CompletedCycle } from "../types";

// ===== STATE & ACTIONS =====

export type FormDataState = {
  completedCycles: CompletedCycle[];
  completedClimbs: CompletedClimb[];
  teamMatchId: number | null;
  comments: string;
};

export type FormDataAction =
  | { type: "set_team_match_id"; payload: number }
  | { type: "set_comments"; payload: string }
  | { type: "add_cycle"; payload: CompletedCycle }
  | { type: "add_climb"; payload: CompletedClimb }
  | { type: "reset" };

// ===== REDUCER =====

function formDataReducer(state: FormDataState, action: FormDataAction): FormDataState {
  switch (action.type) {
    case "set_team_match_id":
      return {
        ...state,
        teamMatchId: action.payload,
      };

    case "set_comments":
      return {
        ...state,
        comments: action.payload,
      };

    case "add_cycle":
      return {
        ...state,
        completedCycles: [...state.completedCycles, action.payload],
      };

    case "add_climb":
      return {
        ...state,
        completedClimbs: [...state.completedClimbs, action.payload],
      };

    case "reset":
      return { completedCycles: [], completedClimbs: [], teamMatchId: null, comments: "" };

    default:
      return state;
  }
}

// ===== CONTEXT =====

type FormDataContextValue = {
  state: FormDataState;
  dispatch: (action: FormDataAction) => void;
};

const FormDataContext = createContext<FormDataContextValue | null>(null);

// ===== PROVIDER =====

export function FormDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(formDataReducer, {
    completedCycles: [],
    completedClimbs: [],
    teamMatchId: null,
    comments: "",
  });

  return (
    <FormDataContext.Provider value={{ state, dispatch }}>{children}</FormDataContext.Provider>
  );
}

// ===== HOOK =====

export function useFormData() {
  const context = useContext(FormDataContext);
  if (!context) {
    throw new Error("useFormData must be used within FormDataProvider");
  }
  return context;
}
