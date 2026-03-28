import { openDB } from "idb";
import { getParserForFile } from "./registry";
import type { StoredLog } from "./LogStore";

const DB_NAME = "log-store";
const DB_VERSION = 2;
const CHUNK_SIZE = 5000;

const LOG_TYPE_STORES: Record<string, string> = {
  dslog: "dslog-records",
};

export interface ImportRequest {
  type: "import";
  fileName: string;
  buffer: ArrayBuffer;
}

export type WorkerMessage =
  | { type: "progress"; percent: number }
  | { type: "done"; log: StoredLog }
  | { type: "error"; message: string };

function post(msg: WorkerMessage) {
  postMessage(msg);
}

async function handleImport(fileName: string, buffer: ArrayBuffer) {
  const parser = getParserForFile(fileName);
  if (!parser) {
    post({ type: "error", message: `Unsupported file type: ${fileName}` });
    return;
  }

  post({ type: "progress", percent: 0 });

  let result;
  try {
    result = parser.parse(buffer);
  } catch (e) {
    post({ type: "error", message: `Parse failed: ${e instanceof Error ? e.message : e}` });
    return;
  }

  post({ type: "progress", percent: 10 });

  const storeName = LOG_TYPE_STORES[parser.logType];
  if (!storeName) {
    post({ type: "error", message: `Unknown log type: ${parser.logType}` });
    return;
  }

  let db;
  try {
    db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("logs")) {
          const logStore = db.createObjectStore("logs", { keyPath: "id" });
          logStore.createIndex("by-imported-at", "importedAt");
          logStore.createIndex("by-log-type", "logType");
        }
        if (!db.objectStoreNames.contains("dslog-records")) {
          const store = db.createObjectStore("dslog-records", { keyPath: "id" });
          store.createIndex("by-log-id", "logId");
          store.createIndex("by-timestamp", "timestamp");
        }
      },
      blocked() {
        post({ type: "error", message: "Database blocked by another connection" });
      },
    });
  } catch (e) {
    post({ type: "error", message: `DB open failed: ${e instanceof Error ? e.message : e}` });
    return;
  }

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

  try {
    const metaTx = db.transaction("logs", "readwrite");
    metaTx.objectStore("logs").put(storedLog);
    await metaTx.done;

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
      post({ type: "progress", percent: 10 + Math.round((end / total) * 90) });
    }
  } catch (e) {
    post({ type: "error", message: `Write failed: ${e instanceof Error ? e.message : e}` });
    db.close();
    return;
  }

  db.close();
  post({ type: "done", log: storedLog });
}

self.onmessage = (e: MessageEvent<ImportRequest>) => {
  if (e.data.type === "import") {
    handleImport(e.data.fileName, e.data.buffer).catch((err) => {
      post({ type: "error", message: `Unexpected: ${err instanceof Error ? err.message : err}` });
    });
  }
};
