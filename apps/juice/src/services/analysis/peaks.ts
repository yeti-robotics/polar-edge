/**
 * Find indices of local maxima in an array.
 * A local maximum is where arr[i] >= arr[i-1] and arr[i] >= arr[i+1]
 * and arr[i] > threshold, with at least minGap samples between peaks.
 */
export function findLocalMaxima(
  arr: number[] | Float64Array,
  threshold = 0,
  minGap = 5
): number[] {
  const peaks: number[] = [];
  for (let i = 1; i < arr.length - 1; i++) {
    if (
      arr[i]! > threshold &&
      arr[i]! >= arr[i - 1]! &&
      arr[i]! >= arr[i + 1]!
    ) {
      if (!peaks.length || i - peaks[peaks.length - 1]! >= minGap) {
        peaks.push(i);
      }
    }
  }
  return peaks;
}
