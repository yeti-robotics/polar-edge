"use client";
import { createContext, useContext, useReducer } from "react";

export const STAGES = ["match_selection", "autonomous", "teleop", "comments", "submit"] as const;
type StandFormStage = (typeof STAGES)[number];

type StandFormState = {
  isOofed: boolean;
  /** Timestamp when current Oof started (ms). Used to derive elapsed seconds across tabs. */
  oofStartedAt: number | null;
  /** Total Oof seconds this match (sum of all segments). */
  oofCumulativeSeconds: number;
  currentStage: StandFormStage;
};

type StandFormAction =
  | {
      type: "increment_stage";
    }
  | {
      type: "decrement_stage";
    }
  | {
      type: "oof_start";
    }
  | {
      type: "oof_end";
    };

const StandFormContext = createContext<{
  state: StandFormState;
  dispatch: (action: StandFormAction) => void;
} | null>(null);

function standFormReducer(current: StandFormState, action: StandFormAction) {
  switch (action.type) {
    case "oof_start":
      return {
        ...current,
        isOofed: true,
        oofStartedAt: Date.now(),
      };
    case "oof_end": {
      const segmentSeconds = current.oofStartedAt
        ? Math.floor((Date.now() - current.oofStartedAt) / 1000)
        : 0;
      return {
        ...current,
        isOofed: false,
        oofStartedAt: null,
        oofCumulativeSeconds: current.oofCumulativeSeconds + segmentSeconds,
      };
    }
    case "increment_stage":
      return {
        ...current,
        currentStage: STAGES[
          Math.min(STAGES.indexOf(current.currentStage) + 1, STAGES.length - 1)
        ] as StandFormStage,
      };
    case "decrement_stage":
      return {
        ...current,
        currentStage: STAGES[
          Math.max(STAGES.indexOf(current.currentStage) - 1, 0)
        ] as StandFormStage,
      };

    default:
      return current;
  }
}

export const StandFormProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(standFormReducer, {
    isOofed: false,
    oofStartedAt: null,
    oofCumulativeSeconds: 0,
    currentStage: "match_selection",
  });

  return (
    <StandFormContext.Provider value={{ state, dispatch }}>{children}</StandFormContext.Provider>
  );
};

export const useStandForm = () => {
  const context = useContext(StandFormContext);
  if (!context) {
    throw new Error("useStandForm used outside of StandFormProvider");
  }
  return context;
};
