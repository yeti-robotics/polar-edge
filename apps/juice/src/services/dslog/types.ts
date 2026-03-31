import type { ParsedRecord } from "../parser";

export interface DSLogHeader {
  version: number;
  timestamp: Date;
}

export interface StatusFlags {
  robotDisabled: boolean;
  robotAuto: boolean;
  robotTeleop: boolean;
  dsDisabled: boolean;
  dsAuto: boolean;
  dsTeleop: boolean;
  watchdog: boolean;
  brownout: boolean;
}

export interface DSLogParsedRecord extends ParsedRecord {
  tripTimeMs: number;
  packetLossPercent: number;
  voltageV: number;
  rioCpuPercent: number;
  canUtilizationPercent: number;
  wifiDbm: number;
  bandwidthMbps: number;
  robotDisabled: boolean;
  robotAuto: boolean;
  robotTeleop: boolean;
  brownout: boolean;
  watchdog: boolean;
  pdpChannels: number[];
  pdpVoltage: number | null;
}

/** Internal record type used during parsing before flattening to DSLogParsedRecord */
export interface DSLogRecord {
  timestamp: Date;
  tripTimeMs: number;
  packetLossPercent: number;
  voltageV: number;
  rioClCpuPercent: number;
  status: StatusFlags;
  canUtilizationPercent: number;
  wifiDbm: number;
  bandwidthMbps: number;
  pdpChannels: number[];
  pdpVoltage: number | null;
  pdpTemperature: number | null;
  pdpResistance: number | null;
}

export type PdpType = "ctre" | "rev" | "none";
