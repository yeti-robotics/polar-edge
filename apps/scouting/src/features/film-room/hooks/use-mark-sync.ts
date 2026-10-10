"use client";

import { toast } from "@repo/ui/components/sonner";
import { useCallback, useEffect, useRef } from "react";
import { isOnline } from "@/lib/offline/network";
import { useQueueCount } from "@/lib/offline/queue-count-context";
import { useNetworkStatus } from "@/lib/offline/use-network-status";
import { deleteAnnotation, saveAnnotation } from "../actions";
import type { MarkOp } from "../logic";
import type { Annotation } from "../types";

const RETRY_MS = 10_000;

function storageKey(videoId: string) {
  return `film-room-queue:${videoId}`;
}

/** Unsynced ops for a video, keyed by mark id. Only the latest op per mark. */
export function readQueuedOps(videoId: string): Map<string, MarkOp> {
  try {
    const raw = window.localStorage.getItem(storageKey(videoId));
    if (!raw) return new Map();
    return new Map(JSON.parse(raw) as [string, MarkOp][]);
  } catch {
    return new Map();
  }
}

function writeQueuedOps(videoId: string, queue: Map<string, MarkOp>) {
  try {
    if (queue.size === 0) window.localStorage.removeItem(storageKey(videoId));
    else window.localStorage.setItem(storageKey(videoId), JSON.stringify([...queue]));
  } catch {
    // Private mode / storage full: the in-memory queue still retries
  }
}

/**
 * Every save/delete goes into a per-video queue, mirrored to localStorage, and
 * is sent straight away. If it can't reach the server it stays queued and
 * retries on reconnect, and every RETRY_MS while anything is waiting. The
 * app-wide pending badge counts what's queued.
 */
export function useMarkSync(videoId: string) {
  const online = useNetworkStatus();
  const { increment, decrement } = useQueueCount();
  const queueRef = useRef<Map<string, MarkOp> | null>(null);
  const flushingRef = useRef(false);
  // The retry timer re-runs every RETRY_MS; only warn about a stall once
  const warnedRef = useRef(false);

  const getQueue = useCallback(() => {
    if (!queueRef.current) queueRef.current = readQueuedOps(videoId);
    return queueRef.current;
  }, [videoId]);

  const flush = useCallback(async () => {
    if (flushingRef.current || !isOnline()) return;
    flushingRef.current = true;
    const queue = getQueue();
    try {
      while (queue.size > 0) {
        const [id, op] = queue.entries().next().value as [string, MarkOp];
        let result: Awaited<ReturnType<typeof saveAnnotation>>;
        try {
          result =
            op.kind === "save"
              ? await saveAnnotation({ videoId, annotation: op.annotation })
              : await deleteAnnotation({ id: op.id });
        } catch {
          // Couldn't reach the server: keep everything queued for the next try
          return;
        }
        // Refused, but a later attempt could land: usually a session that
        // expired mid-match. Keep it queued so signing back in recovers it.
        if ("error" in result && result.retryable) {
          if (!warnedRef.current) {
            warnedRef.current = true;
            toast.error(`Marks aren't saving: ${result.error}`, {
              description: "They're kept on this device and will retry.",
            });
          }
          return;
        }
        warnedRef.current = false;

        // A newer edit to the same mark landed while this one was in flight
        if (queue.get(id) !== op) continue;
        queue.delete(id);
        decrement();
        writeQueuedOps(videoId, queue);
        // Anything else would be rejected again, so drop it and say why
        if ("error" in result) toast.error(`Couldn't save a mark: ${result.error}`);
      }
    } finally {
      flushingRef.current = false;
    }
  }, [decrement, getQueue, videoId]);

  const enqueue = useCallback(
    (id: string, op: MarkOp) => {
      const queue = getQueue();
      if (!queue.has(id)) increment();
      // Re-insert so the newest op for a mark goes to the back of the line
      queue.delete(id);
      queue.set(id, op);
      writeQueuedOps(videoId, queue);
      void flush();
    },
    [flush, getQueue, increment, videoId]
  );

  // Pick up anything left from a previous visit, and release the badge on leave
  useEffect(() => {
    const queue = getQueue();
    const size = queue.size;
    for (let i = 0; i < size; i++) increment();
    void flush();
    return () => decrement(queue.size);
  }, [decrement, flush, getQueue, increment]);

  useEffect(() => {
    if (online) void flush();
  }, [online, flush]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (getQueue().size > 0) void flush();
    }, RETRY_MS);
    return () => window.clearInterval(timer);
  }, [flush, getQueue]);

  return {
    online,
    saveMark: useCallback(
      (annotation: Annotation) => enqueue(annotation.id, { kind: "save", annotation }),
      [enqueue]
    ),
    deleteMark: useCallback((id: string) => enqueue(id, { kind: "delete", id }), [enqueue]),
  };
}
