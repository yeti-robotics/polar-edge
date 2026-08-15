import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import type { ParsedRecord } from "./parser";

export interface StoredLog {
  id: string;
  logType: string;
  fileName: string;
  startTime: number;
  endTime: number;
  recordCount: number;
  createdAt: string;
}

export interface StoredRecord<T extends ParsedRecord = ParsedRecord> {
  id: string;
  logId: string;
  index: number;
  data: T;
}

interface LogStoreDB extends DBSchema {
  logs: {
    key: string;
    value: StoredLog;
    indexes: { "by-logType": string; "by-createdAt": string };
  };
  records: {
    key: string;
    value: StoredRecord;
    indexes: { "by-logId": string };
  };
}

export class LogStoreService {
  private static instance: LogStoreService | null = null;
  private db: IDBPDatabase<LogStoreDB>;

  private constructor(db: IDBPDatabase<LogStoreDB>) {
    this.db = db;
  }

  static async getInstance(): Promise<LogStoreService> {
    if (!LogStoreService.instance) {
      const db = await openDB<LogStoreDB>("juice-logs", 1, {
        upgrade(db) {
          const logStore = db.createObjectStore("logs", { keyPath: "id" });
          logStore.createIndex("by-logType", "logType");
          logStore.createIndex("by-createdAt", "createdAt");

          const recordStore = db.createObjectStore("records", { keyPath: "id" });
          recordStore.createIndex("by-logId", "logId");
        },
      });
      LogStoreService.instance = new LogStoreService(db);
    }
    return LogStoreService.instance;
  }

  async getAllLogs(): Promise<StoredLog[]> {
    return this.db.getAll("logs");
  }

  async getLog(id: string): Promise<StoredLog | undefined> {
    return this.db.get("logs", id);
  }

  async saveLog(
    logType: string,
    fileName: string,
    startTime: number,
    endTime: number,
    records: ParsedRecord[]
  ): Promise<StoredLog> {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const log: StoredLog = {
      id,
      logType,
      fileName,
      startTime,
      endTime,
      recordCount: records.length,
      createdAt: new Date().toISOString(),
    };

    const tx = this.db.transaction(["logs", "records"], "readwrite");
    await tx.objectStore("logs").put(log);
    const recordStore = tx.objectStore("records");
    for (let i = 0; i < records.length; i++) {
      await recordStore.put({
        id: `${id}:${i}`,
        logId: id,
        index: i,
        data: records[i] as ParsedRecord,
      });
    }
    await tx.done;

    return log;
  }

  async getRecordsForLog<T extends ParsedRecord>(
    logId: string,
    _logType: string
  ): Promise<StoredRecord<T>[]> {
    const raw = await this.db.getAllFromIndex("records", "by-logId", logId);
    raw.sort((a, b) => a.index - b.index);
    return raw as StoredRecord<T>[];
  }

  async deleteLog(id: string): Promise<void> {
    const tx = this.db.transaction(["logs", "records"], "readwrite");
    await tx.objectStore("logs").delete(id);
    const keys = await tx.objectStore("records").index("by-logId").getAllKeys(id);
    for (const key of keys) {
      await tx.objectStore("records").delete(key);
    }
    await tx.done;
  }
}
