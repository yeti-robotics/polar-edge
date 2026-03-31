import type { RegressionResult } from "./types";

export function linearRegression(xs: number[], ys: number[]): RegressionResult {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return { m: 0, b: 0, r2: 0 };

  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const xi = xs[i] ?? 0;
    const yi = ys[i] ?? 0;
    sx += xi;
    sy += yi;
    sxx += xi * xi;
    sxy += xi * yi;
    syy += yi * yi;
  }

  const denom = n * sxx - sx * sx;
  if (denom === 0) return { m: 0, b: sy / n, r2: 0 };

  const m = (n * sxy - sx * sy) / denom;
  const b = (sy - m * sx) / n;
  const ssTot = syy - (sy * sy) / n;
  const ssRes = syy - m * sxy - b * sy;
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

  return {
    m: Number(m.toFixed(8)),
    b: Number(b.toFixed(6)),
    r2: Number(r2.toFixed(4)),
  };
}

export function regressionLine(
  xs: number[],
  ys: number[]
): { reg: RegressionResult; points: { x: number; y: number }[] } {
  const reg = linearRegression(xs, ys);
  if (!xs.length) return { reg, points: [] };
  const x0 = xs[0] ?? 0;
  const x1 = xs[xs.length - 1] ?? 0;
  return {
    reg,
    points: [
      { x: x0, y: reg.m * x0 + reg.b },
      { x: x1, y: reg.m * x1 + reg.b },
    ],
  };
}

export function formatEquation(reg: RegressionResult, xLabel = "t", yLabel = "y"): string {
  const sign = reg.b >= 0 ? "+" : "-";
  return `${yLabel} = ${reg.m.toExponential(3)}·${xLabel} ${sign} ${Math.abs(reg.b).toFixed(4)}  (R²=${reg.r2.toFixed(3)})`;
}
