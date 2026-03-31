import { findLocalMaxima } from "./peaks";
import type {
  CurrentStats,
  ImpedanceSample,
  ImpedanceStats,
  PowerStats,
  VoltageStats,
} from "./types";

const I_MIN_IMPEDANCE = 15; // Minimum current (A) for impedance calculation
const BATTERY_CAPACITY_WH = 216; // 18Ah × 12V nominal

/** Estimate open-circuit voltage as the mean of the top 3% of voltage samples. */
export function estimateOCV(volts: number[]): number {
  const sorted = [...volts].sort((a, b) => b - a);
  const topN = Math.max(3, Math.floor(sorted.length * 0.03));
  return sorted.slice(0, topN).reduce((a, b) => a + b, 0) / topN;
}

/** Compute instantaneous power P = V × I. */
export function computePower(volts: number[], currents: number[]): number[] {
  return volts.map((v, i) => {
    const c = currents[i] ?? 0;
    return !Number.isNaN(c) ? Math.max(0, v * c) : NaN;
  });
}

/**
 * Compute impedance samples at current peaks.
 * R = (Voc - V) / I at each peak where I > 15A.
 * Returns R in milliohms.
 */
export function computeImpedance(
  times: number[],
  volts: number[],
  currents: number[],
  ocv: number,
  dt: number
): ImpedanceSample[] {
  const safeCurr = currents.map((c) => (Number.isNaN(c) ? 0 : Math.max(0, c)));
  const minGap = Math.max(1, Math.round(0.1 / dt));
  const peakIdx = findLocalMaxima(safeCurr, I_MIN_IMPEDANCE, minGap);

  return peakIdx
    .map((idx) => {
      const v = volts[idx] ?? 0;
      const c = safeCurr[idx] ?? 0;
      const sag = Math.max(0, ocv - v);
      const R = c > 0 ? (sag / c) * 1000 : NaN;
      return {
        idx,
        t: times[idx] ?? 0,
        v,
        c,
        sag,
        R,
      };
    })
    .filter((s) => !Number.isNaN(s.R) && s.R > 0 && s.R < 150);
}

/** Find indices of current peaks above 30A (for scatter plot). */
export function findCurrentPeaks(currents: number[], dt: number): number[] {
  const safeCurr = currents.map((c) => (Number.isNaN(c) ? 0 : Math.max(0, c)));
  const minGap = Math.max(1, Math.round(0.1 / dt));
  return findLocalMaxima(safeCurr, 30, minGap);
}

export function computeVoltageStats(volts: number[], ocv: number, dt: number): VoltageStats {
  const min = Math.min(...volts);
  const max = Math.max(...volts);
  const mean = volts.reduce((a, b) => a + b, 0) / volts.length;
  const nBelow85 = volts.filter((v) => v < 8.5).length;
  const nBelow63 = volts.filter((v) => v < 6.3).length;

  return {
    min,
    max,
    mean,
    ocv,
    timeBelow85: nBelow85 * dt,
    timeBelow63: nBelow63 * dt,
  };
}

export function computeCurrentStats(currents: number[]): CurrentStats {
  const valid = currents.filter((c) => !Number.isNaN(c) && c > 0);
  return {
    peak: valid.length ? Math.max(...valid) : 0,
    mean: valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0,
    samplesAbove120: currents.filter((c) => !Number.isNaN(c) && c > 120).length,
  };
}

export function computePowerStats(power: number[], dt: number): PowerStats {
  const valid = power.filter((p) => !Number.isNaN(p) && p > 0);
  const peak = valid.length ? Math.max(...valid) : 0;
  const mean = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
  const totalWh = (valid.reduce((a, b) => a + b, 0) * dt) / 3600;

  return {
    peak,
    mean,
    totalWh,
    percentOfCapacity: (totalWh / BATTERY_CAPACITY_WH) * 100,
  };
}

export function computeImpedanceStats(samples: ImpedanceSample[]): ImpedanceStats {
  if (samples.length < 3) {
    return {
      medianR: 0,
      p90R: 0,
      spikeFactor: 0,
      estimatedCCA: 0,
      sampleCount: samples.length,
    };
  }

  const Rs = samples.map((s) => s.R).sort((a, b) => a - b);
  const medianR = Rs[Math.floor(Rs.length / 2)] ?? 0;
  const p90R = Rs[Math.floor(Rs.length * 0.9)] ?? 0;
  // CCA estimate: 7200 / R_median (empirical formula for FRC batteries)
  const estimatedCCA = medianR > 0 ? Math.round(7200 / medianR) : 0;

  return {
    medianR,
    p90R,
    spikeFactor: medianR > 0 ? p90R / medianR : 0,
    estimatedCCA,
    sampleCount: samples.length,
  };
}
