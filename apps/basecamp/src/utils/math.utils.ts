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
 * Rounds a number to the nearest hundredth (2 decimal places).
 */
export function roundToHundredth(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Floors a number to the nearest integer (rounds down).
 */
export function floorToInteger(value: number): number {
  return Math.floor(value);
}

/**
 * Ceils a number to the nearest integer (rounds up).
 */
export function ceilToInteger(value: number): number {
  return Math.ceil(value);
}

/**
 * Converts milliseconds to seconds, rounding up to the nearest whole second.
 */
export function msToSeconds(ms: number): number {
  return Math.ceil(ms / 1000);
}

/**
 * Returns current progress toward a goal as a rounded integer percentage.
 * e.g. roundProgressPercentage(25, 50) → 50
 */
export function roundProgressPercentage(current: number, goal: number): number {
  return Math.round((100 * current) / goal);
}

/**
 * Formats a number as a percentage string with 2 decimal places.
 * e.g. formatPercentage(74.9) → "74.90"
 */
export function formatPercentage(value: number): string {
  return value.toFixed(2);
}
