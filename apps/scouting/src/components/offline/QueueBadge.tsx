"use client";

import { Badge } from "@repo/ui/components/badge";
import { useQueueCount } from "@/lib/offline/queue-count-context";

export function QueueBadge() {
  const { count } = useQueueCount();

  if (count === 0) return null;

  return (
    <Badge variant="warning" role="status" aria-live="polite">
      {count} pending
    </Badge>
  );
}
