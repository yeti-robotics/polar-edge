import { openDB } from "idb";
import { getParserForFile } from "./registry";
import type { StoredLog } from "./LogStore";

const DB_NAME = "log-store";
const DB_VERSION = 2;
const CHUNK_SIZE = 5000;

const LOG_TYPE_STORES: Record<string, string> = {
  dslog: "dslog-records",
};

/** Yield to the main thread so the browser can paint/respond to input */
function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Parse and import a log file into IndexedDB with chunked writes.
 * Yields between chunks to keep the UI responsive.
 */
export async function importLogFile(
  fileName: string,
  buffer: ArrayBuffer,
  onProgress?: (percent: number) => void
): Promise<StoredLog> {
  const parser = getParserForFile(fileName);
  if (!parser) {
    throw new Error(`Unsupported file type: ${fileName}`);
  }

  onProgress?.(0);

  const result = parser.parse(buffer);

  onProgress?.(10);
  await yieldToMain();

  const storeName = LOG_TYPE_STORES[parser.logType];
  if (!storeName) {
    throw new Error(`Unknown log type: ${parser.logType}`);
  }

  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("logs")) {
        const logStore = db.createObjectStore("logs", { keyPath: "id" });
        logStore.createIndex("by-imported-at", "importedAt");
        logStore.createIndex("by-log-type", "logType");
      }
      if (!db.objectStoreNames.contains("dslog-records")) {
        const store = db.createObjectStore("dslog-records", {
          keyPath: "id",
        });
        store.createIndex("by-log-id", "logId");
        store.createIndex("by-timestamp", "timestamp");
      }
    },
  });

  const logId = crypto.randomUUID();
  const storedLog: StoredLog = {
    id: logId,
    logType: parser.logType,
    fileName,
    importedAt: Date.now(),
    startTime: result.startTime,
    endTime: result.endTime,
    recordCount: result.records.length,
  };

  // Write metadata
  const metaTx = db.transaction("logs", "readwrite");
  metaTx.objectStore("logs").put(storedLog);
  await metaTx.done;

  // Write records in chunks, yielding between each
  const total = result.records.length;
  for (let start = 0; start < total; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE, total);
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    for (let i = start; i < end; i++) {
      const { timestamp, ...data } = result.records[i]!;
      store.put({ id: `${logId}-${i}`, logId, timestamp, data });
    }

    await tx.done;

    const percent = 10 + Math.round((end / total) * 90);
    onProgress?.(percent);
    await yieldToMain();
  }

  db.close();
  return storedLog;
}
