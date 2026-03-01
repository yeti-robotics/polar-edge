/**
 * Rounds a number to the nearest tenth (1 decimal place).
 * Useful for avoiding floating-point precision issues in display.
 */
export function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Returns the number with its ordinal suffix (e.g. 1 → "1st", 11 → "11th", 22 → "22nd").
 */
export function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0] ?? "th");
}

/**
 * Formats a number as a percentage.
 */
export function formatPercentage(value: number): string {
  return Math.round(value * 100).toString();
}
