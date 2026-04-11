import { DSLogParser } from "../dslog";
import type { SessionDslogStats } from "../tracker/types";
import {
  computeCurrentStats,
  computeImpedance,
  computeImpedanceStats,
  computePower,
  computePowerStats,
  computeVoltageStats,
  estimateOCV,
} from "./battery";
import { mergeData } from "./merge";
import { parseDSFile } from "./parse-voltage";

/**
 * Parse a dslog file and compute a compact stats summary
 * suitable for storing alongside a battery session.
 */
export function computeSessionStats(
  fileName: string,
  buffer: ArrayBuffer
): SessionDslogStats | null {
  const parsed = parseDSFile(fileName, buffer);
  if (!parsed) return null;

  const data = mergeData(parsed.voltage, parsed.current, parsed.channels);
  if (data.volts.length === 0) return null;

  const ocv = estimateOCV(data.volts);
  const voltage = computeVoltageStats(data.volts, ocv, data.dt);
  const current = computeCurrentStats(data.currents);
  const power = computePowerStats(computePower(data.volts, data.currents), data.dt);
  const impedanceSamples = computeImpedance(data.times, data.volts, data.currents, ocv, data.dt);
  const impedance = computeImpedanceStats(impedanceSamples);

  // Count brownout events from raw dslog records
  const { brownoutCount, brownoutSeconds, matchDurationSeconds } = countBrownouts(fileName, buffer);

  return {
    voltage,
    current,
    power,
    impedance,
    brownoutCount,
    brownoutSeconds,
    matchDurationSeconds,
    fileName,
  };
}

function countBrownouts(
  fileName: string,
  buffer: ArrayBuffer
): { brownoutCount: number; brownoutSeconds: number; matchDurationSeconds: number } {
  const dt = 0.02; // 20ms per record

  if (!fileName.toLowerCase().endsWith(".dslog")) {
    return { brownoutCount: 0, brownoutSeconds: 0, matchDurationSeconds: 0 };
  }

  try {
    const parser = new DSLogParser();
    const result = parser.parse(buffer);

    let brownoutCount = 0;
    let brownoutRecords = 0;
    let enabledRecords = 0;
    let wasBrownout = false;

    for (const r of result.records) {
      if (!r.robotDisabled) {
        enabledRecords++;
      }

      if (r.brownout && !r.robotDisabled) {
        brownoutRecords++;
        if (!wasBrownout) brownoutCount++;
        wasBrownout = true;
      } else {
        wasBrownout = false;
      }
    }

    return {
      brownoutCount,
      brownoutSeconds: Number((brownoutRecords * dt).toFixed(1)),
      matchDurationSeconds: Number((enabledRecords * dt).toFixed(1)),
    };
  } catch {
    return { brownoutCount: 0, brownoutSeconds: 0, matchDurationSeconds: 0 };
  }
}
