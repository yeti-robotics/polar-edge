"use client";

import { useQueueCount } from "@/lib/offline/queue-count-context";
import { useNetworkStatus } from "@/lib/offline/use-network-status";
import { NetworkStatus } from "./NetworkStatus";
import { QueueBadge } from "./QueueBadge";

export function OfflineStatusBar() {
  const online = useNetworkStatus();
  const { count } = useQueueCount();

  if (online && count === 0) return null;

  return (
    <div className="flex items-center justify-end gap-2 border-b px-4 py-1.5">
      <NetworkStatus />
      <QueueBadge />
    </div>
  );
}
