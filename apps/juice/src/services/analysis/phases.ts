import type { MergedData } from "./types";
import type { PDHConfig } from "../pdh/config";

export interface PhaseSegment {
  subsystem: string;
  color: string;
  startT: number;
  endT: number;
}

interface PhaseOptions {
  /** Fraction of subsystem peak current to use as active threshold (default 0.15) */
  thresholdFraction?: number;
  /** Minimum absolute current (A) to count as active, guards against noise (default 3) */
  minAbsoluteA?: number;
  /** Smoothing window in samples (default 10) */
  smoothWindow?: number;
  /** Merge gaps shorter than this (seconds) into one segment (default 0.4) */
  mergeGapS?: number;
  /** Discard segments shorter than this (seconds) (default 0.2) */
  minDurationS?: number;
}

export function detectPhases(
  data: MergedData,
  config: PDHConfig,
  options: PhaseOptions = {}
): PhaseSegment[] {
  const {
    thresholdFraction = 0.15,
    minAbsoluteA = 3,
    smoothWindow = 10,
    mergeGapS = 0.4,
    minDurationS = 0.2,
  } = options;

  const segments: PhaseSegment[] = [];
  const n = data.times.length;
  if (n === 0) return segments;

  for (const sub of config.subsystems) {
    const chIndices = config.channels
      .map((ch, idx) => (ch.subsystem === sub.name ? idx : -1))
      .filter((idx) => idx !== -1);

    if (chIndices.length === 0) continue;

    // Sum channel currents at each sample
    const raw = Array.from({ length: n }, (_, i) =>
      chIndices.reduce((sum, ch) => sum + (data.channels[`CH ${ch}`]?.[i] ?? 0), 0)
    );

    // Rolling mean smoothing
    const smoothed = new Array(n).fill(0) as number[];
    for (let i = 0; i < n; i++) {
      const lo = Math.max(0, i - smoothWindow);
      let s = 0;
      for (let j = lo; j <= i; j++) s += raw[j] ?? 0;
      smoothed[i] = s / (i - lo + 1);
    }

    const peak = Math.max(...smoothed);
    const threshold = Math.max(minAbsoluteA, peak * thresholdFraction);

    // Build boolean active mask
    const active = smoothed.map((v) => v >= threshold);

    // Convert mask to raw segments
    const raw_segs: { startT: number; endT: number }[] = [];
    let inSeg = false;
    let segStart = 0;

    for (let i = 0; i < n; i++) {
      if (!inSeg && active[i]) {
        inSeg = true;
        segStart = data.times[i] ?? 0;
      } else if (inSeg && !active[i]) {
        inSeg = false;
        raw_segs.push({ startT: segStart, endT: data.times[i - 1] ?? segStart });
      }
    }
    if (inSeg) raw_segs.push({ startT: segStart, endT: data.times[n - 1] ?? segStart });

    // Merge close segments
    const merged: { startT: number; endT: number }[] = [];
    for (const seg of raw_segs) {
      const prev = merged[merged.length - 1];
      if (prev && seg.startT - prev.endT <= mergeGapS) {
        prev.endT = seg.endT;
      } else {
        merged.push({ ...seg });
      }
    }

    // Filter short segments and emit
    for (const seg of merged) {
      if (seg.endT - seg.startT >= minDurationS) {
        segments.push({ subsystem: sub.name, color: sub.color, startT: seg.startT, endT: seg.endT });
      }
    }
  }

  return segments.sort((a, b) => a.startT - b.startT);
}
