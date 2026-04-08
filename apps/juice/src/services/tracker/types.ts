export interface Battery {
  id: string;
  name: string;
  notes: string;
  retired: boolean;
  createdAt: string; // ISO
}

export type SessionPerformance = "excellent" | "good" | "ok" | "poor";

export interface BatterySession {
  id: string;
  batteryId: string;
  batteryName: string;
  kw700MOhms: number | null;
  voltage: number | null;
  checkedOutAt: string; // ISO
  checkedInAt: string | null; // null = in use
  performance: SessionPerformance | null;
  hadBrownout: boolean | null;
  brownoutTiming: string | null;
  notes: string;
}

export interface DashboardStats {
  total: number;
  available: number;
  inUse: number;
  brownouts: number;
}

export interface FleetBattery extends Battery {
  lastKw700: number | null;
  sessionCount: number;
  brownoutCount: number;
  lastPerformance: SessionPerformance | null;
  isInUse: boolean;
  activeSessionId: string | null;
}
