export interface DSVoltagePoint {
  t: number;
  v: number;
}

export interface CANCurrentPoint {
  t: number;
  current: number;
}

export interface MergedData {
  times: number[];
  volts: number[];
  currents: number[];
  /** Per-channel current arrays, keyed by channel name (e.g. "CH 0", "CH 1") */
  channels: Record<string, number[]>;
  dt: number;
  hasCurrent: boolean;
}

export interface RegressionResult {
  m: number;
  b: number;
  r2: number;
}

export interface ImpedanceSample {
  idx: number;
  t: number;
  v: number;
  c: number;
  sag: number;
  /** Internal resistance in milliohms */
  R: number;
}

export interface VoltageStats {
  min: number;
  max: number;
  mean: number;
  ocv: number;
  timeBelow85: number;
  timeBelow63: number;
}

export interface CurrentStats {
  peak: number;
  mean: number;
  samplesAbove120: number;
}

export interface PowerStats {
  peak: number;
  mean: number;
  totalWh: number;
  percentOfCapacity: number;
}

export interface ImpedanceStats {
  medianR: number;
  p90R: number;
  spikeFactor: number;
  estimatedCCA: number;
  sampleCount: number;
}
