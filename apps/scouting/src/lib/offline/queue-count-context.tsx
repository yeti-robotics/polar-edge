"use client";

import { createContext, useCallback, useContext, useState } from "react";

type QueueCountContextValue = {
  count: number;
  increment: () => void;
  decrement: (by?: number) => void;
  setCount: (n: number) => void;
};

const QueueCountContext = createContext<QueueCountContextValue | null>(null);

export function QueueCountProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => setCount((c) => c + 1), []);
  const decrement = useCallback((by = 1) => setCount((c) => Math.max(0, c - by)), []);

  return (
    <QueueCountContext.Provider value={{ count, increment, decrement, setCount }}>
      {children}
    </QueueCountContext.Provider>
  );
}

export function useQueueCount(): QueueCountContextValue {
  const context = useContext(QueueCountContext);
  if (!context) {
    throw new Error("useQueueCount must be used within QueueCountProvider");
  }
  return context;
}
