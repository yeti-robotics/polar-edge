"use client";

import { toast } from "@repo/ui/components/sonner";
import { useEffect, useRef } from "react";
import { useNetworkStatus } from "./use-network-status";

export const offlineToasts = {
  savedOffline: () => toast.info("Saved offline (will sync when online)"),
  submittedOnline: () => toast.success("Submitted successfully"),
  syncComplete: (count: number) =>
    toast.success(`${count} form${count === 1 ? "" : "s"} synced successfully`),
  syncFailed: () => toast.error("Failed to sync after 5 attempts"),
};

export function useOfflineToasts() {
  const online = useNetworkStatus();
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    if (online) {
      toast.success("Connection restored");
    } else {
      toast.warning("You are offline");
    }
  }, [online]);
}
