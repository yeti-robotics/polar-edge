import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import type {
  Battery,
  BatterySession,
  DashboardStats,
  FleetBattery,
  SessionPerformance,
} from "./types";

interface TrackerDB extends DBSchema {
  batteries: {
    key: string;
    value: Battery;
    indexes: { "by-name": string };
  };
  sessions: {
    key: string;
    value: BatterySession;
    indexes: {
      "by-battery": string;
      "by-checkedInAt": string | null;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<TrackerDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<TrackerDB>("battrack", 1, {
      upgrade(db) {
        const batteryStore = db.createObjectStore("batteries", { keyPath: "id" });
        batteryStore.createIndex("by-name", "name");

        const sessionStore = db.createObjectStore("sessions", { keyPath: "id" });
        sessionStore.createIndex("by-battery", "batteryId");
        sessionStore.createIndex("by-checkedInAt", "checkedInAt");
      },
    });
  }
  return dbPromise;
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Batteries ──────────────────────────────────────────────────────────────

export async function addBattery(name: string, notes = ""): Promise<Battery> {
  const db = await getDB();
  const battery: Battery = {
    id: uid(),
    name,
    notes,
    retired: false,
    createdAt: new Date().toISOString(),
  };
  await db.put("batteries", battery);
  return battery;
}

export async function retireBattery(id: string): Promise<void> {
  const db = await getDB();
  const battery = await db.get("batteries", id);
  if (!battery) return;
  battery.retired = true;
  await db.put("batteries", battery);
}

export async function deleteBattery(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("batteries", id);
}

export async function getAllBatteries(): Promise<Battery[]> {
  const db = await getDB();
  return db.getAll("batteries");
}

// ── Sessions ───────────────────────────────────────────────────────────────

export async function checkOutBattery(
  batteryId: string,
  batteryName: string,
  kw700MOhms: number | null,
  voltage: number | null
): Promise<BatterySession> {
  const db = await getDB();
  const session: BatterySession = {
    id: uid(),
    batteryId,
    batteryName,
    kw700MOhms,
    voltage,
    checkedOutAt: new Date().toISOString(),
    checkedInAt: null,
    performance: null,
    hadBrownout: null,
    brownoutTiming: null,
    notes: "",
  };
  await db.put("sessions", session);
  return session;
}

export async function checkInBattery(
  sessionId: string,
  performance: SessionPerformance,
  hadBrownout: boolean,
  brownoutTiming: string | null,
  notes: string
): Promise<void> {
  const db = await getDB();
  const session = await db.get("sessions", sessionId);
  if (!session) return;
  session.checkedInAt = new Date().toISOString();
  session.performance = performance;
  session.hadBrownout = hadBrownout;
  session.brownoutTiming = brownoutTiming;
  session.notes = notes;
  await db.put("sessions", session);
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("sessions", id);
}

export async function getAllSessions(): Promise<BatterySession[]> {
  const db = await getDB();
  return db.getAll("sessions");
}

export async function getActiveSessions(): Promise<BatterySession[]> {
  const sessions = await getAllSessions();
  return sessions.filter((s) => s.checkedInAt === null);
}

export async function getCompletedSessions(): Promise<BatterySession[]> {
  const sessions = await getAllSessions();
  return sessions
    .filter((s): s is BatterySession & { checkedInAt: string } => s.checkedInAt !== null)
    .sort((a, b) => new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime());
}

// ── Derived Data ───────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const batteries = await getAllBatteries();
  const sessions = await getAllSessions();
  const active = batteries.filter((b) => !b.retired);
  const inUseBatteryIds = new Set(
    sessions.filter((s) => s.checkedInAt === null).map((s) => s.batteryId)
  );
  const inUse = active.filter((b) => inUseBatteryIds.has(b.id)).length;
  const brownouts = sessions.filter((s) => s.hadBrownout === true).length;

  return {
    total: active.length,
    available: active.length - inUse,
    inUse,
    brownouts,
  };
}

export async function getFleetBatteries(): Promise<FleetBattery[]> {
  const batteries = await getAllBatteries();
  const sessions = await getAllSessions();

  return batteries
    .filter((b) => !b.retired)
    .map((b) => {
      const batterySessions = sessions.filter((s) => s.batteryId === b.id);
      const completed = batterySessions.filter(
        (s): s is BatterySession & { checkedInAt: string } => s.checkedInAt !== null
      );
      const activeSession = batterySessions.find((s) => s.checkedInAt === null);
      const lastCompleted = completed.sort(
        (a, b) => new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime()
      )[0];

      return {
        ...b,
        lastKw700: lastCompleted?.kw700MOhms ?? null,
        sessionCount: completed.length,
        brownoutCount: completed.filter((s) => s.hadBrownout === true).length,
        lastPerformance: lastCompleted?.performance ?? null,
        isInUse: !!activeSession,
        activeSessionId: activeSession?.id ?? null,
      };
    });
}
