import { DSLogParser } from "../dslog";
import type { CANCurrentPoint, DSVoltagePoint } from "./types";

export interface DSLogParseResult {
  voltage: DSVoltagePoint[];
  current: CANCurrentPoint[];
  /** Per-channel current arrays, keyed by channel name */
  channels: Record<string, number[]>;
}

/**
 * Parse a DS Log file using the proper DSLogParser.
 * Extracts both voltage and total current (sum of PDP channels).
 * Falls back to CSV parsing for non-.dslog files.
 */
export function parseDSFile(fileName: string, buffer: ArrayBuffer): DSLogParseResult | null {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".dslog")) {
    return parseDSLogBinary(buffer);
  }

  // CSV fallback — voltage only (no PDP channel data in CSV exports)
  const text = new TextDecoder().decode(buffer);
  const voltage = parseDSCSV(text);
  if (!voltage) return null;
  return { voltage, current: [], channels: {} };
}

function parseDSLogBinary(buffer: ArrayBuffer): DSLogParseResult | null {
  const parser = new DSLogParser();

  try {
    const result = parser.parse(buffer);
    if (result.records.length < 10) return null;

    const _startTs = result.records[0]?.timestamp;

    const voltage: DSVoltagePoint[] = [];
    const current: CANCurrentPoint[] = [];

    // Filter to only auto/teleop periods (skip disabled/disconnected)
    const enabled = result.records.filter(
      (r) => (r.robotAuto || r.robotTeleop) && r.voltageV > 0 && r.voltageV <= 20
    );
    if (enabled.length < 10) return null;

    const enabledStartTs = enabled[0]?.timestamp;
    const channelCount = enabled[0]?.pdpChannels.length;
    const channels: Record<string, number[]> = {};
    for (let ch = 0; ch < channelCount; ch++) {
      channels[`CH ${ch}`] = [];
    }

    for (const record of enabled) {
      const t = Number(((record.timestamp - enabledStartTs) / 1000).toFixed(3));
      voltage.push({ t, v: record.voltageV });

      const totalCurrent = record.pdpChannels.reduce((a, b) => a + b, 0);
      current.push({ t, current: Number(totalCurrent.toFixed(3)) });

      for (let ch = 0; ch < record.pdpChannels.length; ch++) {
        channels[`CH ${ch}`]?.push(record.pdpChannels[ch] ?? 0);
      }
    }

    return { voltage, current, channels };
  } catch {
    return null;
  }
}

function parseDSCSV(raw: string): DSVoltagePoint[] | null {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim());

  if (lines.length < 5) return null;

  // Auto-detect delimiter
  const sample = lines.slice(0, 6).join("\n");
  const tabCount = (sample.match(/\t/g) || []).length;
  const commaCount = (sample.match(/,/g) || []).length;
  const semiCount = (sample.match(/;/g) || []).length;
  const delim =
    tabCount > commaCount && tabCount > semiCount ? "\t" : semiCount > commaCount ? ";" : ",";

  const split = (l: string) => l.split(delim).map((s) => s.trim().replace(/"/g, ""));

  // Find header row
  let hIdx = 0;
  let hdrs: string[] = [];
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const cols = split(lines[i] ?? "");
    const numericCount = cols.filter((c) => !Number.isNaN(Number.parseFloat(c)) && c !== "").length;
    if (numericCount < cols.length * 0.65) {
      hdrs = cols;
      hIdx = i;
      break;
    }
  }

  const findCol = (...keywords: string[]): number => {
    for (const kw of keywords) {
      const k = kw.toLowerCase().replace(/[^a-z]/g, "");
      const idx = hdrs.findIndex((h) =>
        h
          .toLowerCase()
          .replace(/[^a-z]/g, "")
          .includes(k)
      );
      if (idx !== -1) return idx;
    }
    return -1;
  };

  let iT = findCol("time", "timestamp", "elapsed");
  let iV = findCol("battery", "voltage", "volt", "batt", "vbat");

  // Fallback: detect voltage column by value range
  if (iV === -1) {
    const ncols = split(lines[hIdx + 1] || lines[0] || "").length;
    const colSamples: number[][] = Array.from({ length: ncols }, () => []);
    for (let i = hIdx + 1; i < Math.min(hIdx + 200, lines.length); i++) {
      split(lines[i] ?? "").forEach((c, j) => {
        const v = Number.parseFloat(c);
        if (!Number.isNaN(v) && j < ncols) colSamples[j]?.push(v);
      });
    }
    for (let j = 0; j < ncols; j++) {
      const sorted = [...(colSamples[j] ?? [])].sort((a, b) => a - b);
      const med = sorted[Math.floor(sorted.length / 2)];
      if (med !== undefined && med >= 9 && med <= 13.5 && (sorted[0] ?? 0) >= 5) {
        iV = j;
        if (iT === -1 && j > 0) iT = 0;
        break;
      }
    }
  }

  if (iV === -1) return null;

  const data: DSVoltagePoint[] = [];
  for (let i = hIdx + 1; i < lines.length; i++) {
    const cols = split(lines[i] ?? "");
    const v = Number.parseFloat(cols[iV] ?? "");
    if (Number.isNaN(v) || v < 3 || v > 16) continue;
    const t = iT !== -1 ? Number.parseFloat(cols[iT] ?? "") : data.length * 0.02;
    data.push({
      t: Number.isNaN(t) ? data.length * 0.02 : t,
      v: Number(v.toFixed(4)),
    });
  }

  return data.length > 10 ? data : null;
}
