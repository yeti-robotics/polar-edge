"use client";

import { useOfflineToasts } from "@/lib/offline/use-offline-toasts";

export function OfflineToastListener() {
  useOfflineToasts();
  return null;
}
