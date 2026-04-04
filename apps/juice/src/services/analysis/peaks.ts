/**
 * Find indices of local maxima in an array.
 * A local maximum is where arr[i] >= arr[i-1] and arr[i] >= arr[i+1]
 * and arr[i] > threshold, with at least minGap samples between peaks.
 */
export function findLocalMaxima(arr: number[] | Float64Array, threshold = 0, minGap = 5): number[] {
  const peaks: number[] = [];
  for (let i = 1; i < arr.length - 1; i++) {
    const cur = arr[i] ?? 0;
    if (cur > threshold && cur >= (arr[i - 1] ?? 0) && cur >= (arr[i + 1] ?? 0)) {
      if (!peaks.length || i - (peaks[peaks.length - 1] ?? 0) >= minGap) {
        peaks.push(i);
      }
    }
  }
  return peaks;
}
