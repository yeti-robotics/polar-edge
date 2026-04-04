/**
 * Causal (backward-looking) rolling window functions.
 * out[i] is computed from arr[max(0, i-w+1)..i].
 */

export function rollingMin(arr: Float64Array, w: number): Float64Array {
  const out = new Float64Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    let m = Infinity;
    for (let j = Math.max(0, i - w + 1); j <= i; j++) {
      if ((arr[j] ?? 0) < m) m = arr[j] ?? 0;
    }
    out[i] = m;
  }
  return out;
}

export function rollingMean(arr: Float64Array, w: number): Float64Array {
  const out = new Float64Array(arr.length);
  let s = 0;
  let c = 0;
  for (let i = 0; i < arr.length; i++) {
    s += arr[i] ?? 0;
    c++;
    if (i >= w) {
      s -= arr[i - w] ?? 0;
      c--;
    }
    out[i] = s / c;
  }
  return out;
}

export function rollingMedian(arr: Float64Array, w: number): Float64Array {
  const out = new Float64Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    const start = Math.max(0, i - w + 1);
    const win = Array.from(arr.slice(start, i + 1)).sort((a, b) => a - b);
    out[i] = win[Math.floor(win.length / 2)] ?? 0;
  }
  return out;
}
