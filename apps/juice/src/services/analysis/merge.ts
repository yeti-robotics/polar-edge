import type { CANCurrentPoint, DSVoltagePoint, MergedData } from "./types";

/**
 * Merge DS Log voltage data (master timeline) with CAN current data
 * by linearly interpolating CAN readings onto DS timestamps.
 */
export function mergeData(
  dsData: DSVoltagePoint[],
  canData: CANCurrentPoint[] | null,
  channels: Record<string, number[]> = {}
): MergedData {
  const sorted = [...dsData].sort((a, b) => a.t - b.t);
  const times = sorted.map((d) => d.t);
  const volts = sorted.map((d) => d.v);
  const dt =
    times.length > 1
      ? (times[times.length - 1]! - times[0]!) / (times.length - 1)
      : 0.02;

  let currents: number[];

  if (canData && canData.length > 3) {
    const sortedCan = [...canData].sort((a, b) => a.t - b.t);
    currents = interpolateCurrents(sorted, sortedCan);
  } else {
    currents = new Array(times.length).fill(NaN) as number[];
  }

  const hasCurrent = currents.some((c) => !Number.isNaN(c) && c > 0);

  return { times, volts, currents, channels, dt, hasCurrent };
}

function interpolateCurrents(
  dsData: DSVoltagePoint[],
  canData: CANCurrentPoint[]
): number[] {
  const currents: number[] = [];
  let ci = 0;

  for (const ds of dsData) {
    while (ci < canData.length - 2 && canData[ci + 1]!.t <= ds.t) ci++;

    if (ci >= canData.length - 1) {
      currents.push(canData[canData.length - 1]!.current);
    } else if (ds.t <= canData[0]!.t) {
      currents.push(canData[0]!.current);
    } else {
      const a = canData[ci]!;
      const b = canData[ci + 1]!;
      const frac = b.t === a.t ? 0 : (ds.t - a.t) / (b.t - a.t);
      currents.push(
        Number((a.current + frac * (b.current - a.current)).toFixed(3))
      );
    }
  }

  return currents;
}
