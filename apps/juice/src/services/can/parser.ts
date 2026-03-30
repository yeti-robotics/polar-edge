import type { CANCurrentPoint } from "../analysis/types";

const CURRENT_KEYWORDS = [
  "current",
  "amps",
  "amp",
  "outputcurrent",
  "statorcurrent",
  "supplycurrent",
  "buscurrent",
  "motorcurrent",
  "drawcurrent",
];

function isCurrentKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z]/g, "");
  return CURRENT_KEYWORDS.some((kw) => normalized.includes(kw));
}

function isTimeKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z]/g, "");
  return (
    normalized === "time" ||
    normalized === "timestamp" ||
    normalized === "elapsed" ||
    normalized === "t"
  );
}

/**
 * Parse CAN JSON data and sum device currents per timestep.
 * Supports both array-of-objects and columnar formats.
 * Auto-detects current fields by name heuristic.
 */
export function parseCANJSON(text: string): CANCurrentPoint[] | null {
  let json: unknown;
  try {
    json = JSON.parse(text.trim());
  } catch {
    // Try newline-delimited JSON
    try {
      const rows = text
        .trim()
        .split("\n")
        .filter((l) => l.trim())
        .map((l) => JSON.parse(l));
      json = rows;
    } catch {
      return null;
    }
  }

  const records = normalizeToRecords(json);
  if (!records || records.length === 0) return null;

  return extractCurrents(records);
}

function normalizeToRecords(
  json: unknown
): Record<string, unknown>[] | null {
  if (Array.isArray(json)) {
    return json as Record<string, unknown>[];
  }

  if (typeof json === "object" && json !== null) {
    const obj = json as Record<string, unknown>;
    // Columnar format: { timestamps: [], device1: [], device2: [] }
    const timeArr =
      (obj.timestamps as unknown[]) ??
      (obj.time as unknown[]) ??
      (obj.t as unknown[]);
    if (Array.isArray(timeArr)) {
      const otherKeys = Object.keys(obj).filter(
        (k) => k !== "timestamps" && k !== "time" && k !== "t" && Array.isArray(obj[k])
      );
      return timeArr.map((t, i) => {
        const rec: Record<string, unknown> = { time: t };
        for (const k of otherKeys) {
          rec[k] = (obj[k] as unknown[])[i];
        }
        return rec;
      });
    }

    return [obj]; // Single record fallback
  }

  return null;
}

function extractCurrents(
  records: Record<string, unknown>[]
): CANCurrentPoint[] | null {
  const sample = records[0]!;

  // Find current keys by name heuristic
  let currentKeys = Object.keys(sample).filter(
    (k) => isCurrentKey(k) && typeof sample[k] === "number"
  );

  // Fallback: try all numeric fields in reasonable current range
  if (currentKeys.length === 0) {
    currentKeys = Object.keys(sample).filter((k) => {
      if (isTimeKey(k)) return false;
      const v = Number(sample[k]);
      return !Number.isNaN(v) && Math.abs(v) <= 500;
    });
  }

  // Find time key
  const timeKey = Object.keys(sample).find((k) => isTimeKey(k)) ?? null;

  const data: CANCurrentPoint[] = [];
  for (let idx = 0; idx < records.length; idx++) {
    const rec = records[idx]!;
    const t = timeKey ? Number(rec[timeKey]) : idx * 0.02;
    if (Number.isNaN(t)) continue;

    // Sum all current values; clamp negatives to 0 (regenerative braking)
    let sum = 0;
    for (const k of currentKeys) {
      const v = Number(rec[k]);
      if (!Number.isNaN(v)) sum += Math.max(0, v);
    }

    data.push({
      t: Number.isNaN(t) ? data.length * 0.02 : t,
      current: Number(sum.toFixed(3)),
    });
  }

  return data.length > 3 ? data : null;
}
