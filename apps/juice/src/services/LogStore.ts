import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import type { ParseResult, ParsedRecord } from "./parser";
import type { DSLogParsedRecord } from "./dslog";

// -- Stored types --

export interface StoredLog {
  id: string;
  logType: string;
  fileName: string;
  importedAt: number;
  startTime: number;
  endTime: number;
  recordCount: number;
}

export interface StoredRecord<T = Record<string, unknown>> {
  id: string;
  logId: string;
  timestamp: number;
  data: T;
}

// -- Schema --
// Each log type gets its own record store. Add new stores here when adding parsers.

interface LogStoreSchema extends DBSchema {
  logs: {
    key: string;
    value: StoredLog;
    indexes: {
      "by-imported-at": number;
      "by-log-type": string;
    };
  };
  "dslog-records": {
    key: string;
    value: StoredRecord<DSLogParsedRecord>;
    indexes: {
      "by-log-id": string;
      "by-timestamp": number;
    };
  };
}

/** Add new record store names here when adding log types */
type RecordStoreName = "dslog-records";

const LOG_TYPE_STORES: Record<string, RecordStoreName> = {
  dslog: "dslog-records",
};

const DB_NAME = "log-store";
const DB_VERSION = 2;

class LogStoreService {
  private static instance: LogStoreService | null = null;
  private db: IDBPDatabase<LogStoreSchema> | null = null;

  private constructor() {}

  static async getInstance(): Promise<LogStoreService> {
    if (!LogStoreService.instance) {
      const service = new LogStoreService();
      await service.init();
      LogStoreService.instance = service;
    }
    return LogStoreService.instance;
  }

  private async init() {
    this.db = await openDB<LogStoreSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Logs metadata store
        if (!db.objectStoreNames.contains("logs")) {
          const logStore = db.createObjectStore("logs", { keyPath: "id" });
          logStore.createIndex("by-imported-at", "importedAt");
          logStore.createIndex("by-log-type", "logType");
        }

        // DSLog records store
        if (!db.objectStoreNames.contains("dslog-records")) {
          const store = db.createObjectStore("dslog-records", {
            keyPath: "id",
          });
          store.createIndex("by-log-id", "logId");
          store.createIndex("by-timestamp", "timestamp");
        }
      },
    });
  }

  private getDb(): IDBPDatabase<LogStoreSchema> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    return this.db;
  }

  private getStoreName(logType: string): RecordStoreName {
    const store = LOG_TYPE_STORES[logType];
    if (!store) {
      throw new Error(`Unknown log type: ${logType}`);
    }
    return store;
  }

  // -- Log (file-level) operations --

  async importLog(
    fileName: string,
    logType: string,
    result: ParseResult
  ): Promise<string> {
    const db = this.getDb();
    const logId = crypto.randomUUID();
    const storeName = this.getStoreName(logType);

    const storedLog: StoredLog = {
      id: logId,
      logType,
      fileName,
      importedAt: Date.now(),
      startTime: result.startTime,
      endTime: result.endTime,
      recordCount: result.records.length,
    };

    const tx = db.transaction(["logs", storeName], "readwrite");
    tx.objectStore("logs").put(storedLog);

    const recordStore = tx.objectStore(storeName);
    for (let i = 0; i < result.records.length; i++) {
      const { timestamp, ...data } = result.records[i]!;
      recordStore.put({
        id: `${logId}-${i}`,
        logId,
        timestamp,
        data: data as StoredRecord<DSLogParsedRecord>["data"],
      });
    }

    await tx.done;
    return logId;
  }

  async getAllLogs(): Promise<StoredLog[]> {
    return this.getDb().getAllFromIndex("logs", "by-imported-at");
  }

  async getLog(id: string): Promise<StoredLog | undefined> {
    return this.getDb().get("logs", id);
  }

  async deleteLog(id: string): Promise<void> {
    const db = this.getDb();
    const log = await db.get("logs", id);
    if (!log) return;

    const storeName = this.getStoreName(log.logType);
    const keys = await db.getAllKeysFromIndex(storeName, "by-log-id", id);

    const tx = db.transaction(["logs", storeName], "readwrite");
    tx.objectStore("logs").delete(id);
    const recordStore = tx.objectStore(storeName);
    for (const key of keys) {
      recordStore.delete(key);
    }
    await tx.done;
  }

  // -- Record-level operations --

  async getRecordsForLog<T = Record<string, unknown>>(
    logId: string,
    logType: string
  ): Promise<StoredRecord<T>[]> {
    const storeName = this.getStoreName(logType);
    return this.getDb().getAllFromIndex(
      storeName,
      "by-log-id",
      logId
    ) as Promise<StoredRecord<T>[]>;
  }

  /** Close the IDB connection (e.g. before a worker import) */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /** Reopen after close */
  async reopen() {
    await this.init();
  }

  async clearAll(): Promise<void> {
    const db = this.getDb();
    const storeNames = ["logs", ...Object.values(LOG_TYPE_STORES)] as const;
    const tx = db.transaction([...storeNames], "readwrite");
    for (const name of storeNames) {
      tx.objectStore(name).clear();
    }
    await tx.done;
  }
}

export { LogStoreService };
