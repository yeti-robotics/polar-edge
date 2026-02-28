import { useSyncExternalStore } from "react";
import { isOnline, onNetworkChange } from "./network";

function subscribe(callback: () => void): () => void {
  return onNetworkChange(() => callback());
}

function getSnapshot(): boolean {
  return isOnline();
}

function getServerSnapshot(): boolean {
  return true;
}

export function useNetworkStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
