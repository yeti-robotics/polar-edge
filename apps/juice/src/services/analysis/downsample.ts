/** Downsample an array to at most maxPoints by taking every Nth element. */
export function downsample<T>(arr: T[], maxPoints = 900): T[] {
  const step = Math.max(1, Math.floor(arr.length / maxPoints));
  if (step === 1) return arr;
  const out: T[] = [];
  for (let i = 0; i < arr.length; i += step) {
    const val = arr[i];
    if (val !== undefined) out.push(val);
  }
  return out;
}

/** Create downsampled index array for a given length. */
export function downsampleIndices(n: number, maxPoints = 900): number[] {
  const step = Math.max(1, Math.floor(n / maxPoints));
  return Array.from({ length: Math.ceil(n / step) }, (_, i) => i * step);
}
