/**
 * Rounds a number to the nearest tenth (1 decimal place).
 * Useful for avoiding floating-point precision issues in display.
 */
export function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}
