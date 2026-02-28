"use client";

import { Badge } from "@repo/ui/components/badge";
import { useNetworkStatus } from "@/lib/offline/use-network-status";

export function NetworkStatus() {
  const online = useNetworkStatus();

  if (online) return null;

  return (
    <Badge variant="destructive" role="status" aria-live="polite">
      <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-current" />
      Offline
    </Badge>
  );
}
