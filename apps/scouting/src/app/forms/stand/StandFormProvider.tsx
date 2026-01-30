"use client";

import React, { createContext, useContext, useReducer } from "react";

type StandFormState = {
  isOofed: boolean;
};

export enum StandFormActionTypes {
  OOF_START = "oof_start",
  OOF_END = "oof_end",
}

type StandFormAction =
  | {
      type: StandFormActionTypes.OOF_START;
    }
  | {
      type: StandFormActionTypes.OOF_END;
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
      };
    case "oof_end":
      return {
        ...current,
        isOofed: false,
      };
    default:
      return current;
  }
}

export const useStandForm = () => {
  const context = useContext(StandFormContext);
  if (!context) {
    throw new Error("useStandForm used outside of StandFormProvider");
  }
  return context;
};

export const StandFormProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(standFormReducer, { isOofed: false });

  const handleDispatch = (action: StandFormAction) => {
    dispatch(action);
  };

  return (
    <StandFormContext.Provider value={{ state, dispatch: handleDispatch }}>
      {children}
    </StandFormContext.Provider>
  );
};
