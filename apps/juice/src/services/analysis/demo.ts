import type { CANCurrentPoint, DSVoltagePoint } from "./types";

/**
 * Generate synthetic match data for demo purposes.
 * Simulates ~160s match with realistic voltage sag and current profiles.
 */
export function generateDemoData(): {
  dsData: DSVoltagePoint[];
  canData: CANCurrentPoint[];
} {
  const dsData: DSVoltagePoint[] = [];
  const canData: CANCurrentPoint[] = [];
  let soc = 0.91;
  let t = 0;

  for (let i = 0; i < 8000; i++) {
    // Current load profile: pre-match idle → auto → teleop
    let load: number;
    if (i < 250) {
      load = 8 + Math.random() * 4;
    } else if (i < 1000) {
      load = 70 + Math.sin(i * 0.2) * 40 + (Math.random() < 0.08 ? 140 : 0) + Math.random() * 10;
    } else {
      load =
        52 +
        Math.sin(i * 0.055) * 35 +
        Math.sin(i * 0.22) * 18 +
        (Math.random() < 0.05 ? 155 + Math.random() * 60 : 0) +
        Math.random() * 12;
    }

    const imp = 0.013 + (1 - soc) * 0.028 + (Math.random() - 0.5) * 0.003;
    const v = Math.max(6.1, 12.6 * soc - load * imp + (Math.random() - 0.5) * 0.07);

    dsData.push({
      t: Number(t.toFixed(3)),
      v: Number(v.toFixed(4)),
    });

    // Split total load across 6 CAN devices
    canData.push({
      t: Number(t.toFixed(3)),
      current: Number(
        (
          Math.max(0, load * 0.22 + (Math.random() - 0.5) * 2) +
          Math.max(0, load * 0.22 + (Math.random() - 0.5) * 2) +
          Math.max(0, load * 0.22 + (Math.random() - 0.5) * 2) +
          Math.max(0, load * 0.22 + (Math.random() - 0.5) * 2) +
          Math.max(0, load * 0.08 + (Math.random() - 0.5) * 1) +
          Math.max(0, load * 0.04 + (Math.random() - 0.5) * 0.5)
        ).toFixed(3)
      ),
    });

    soc -= load * 1e-7;
    t += 0.02;
  }

  return { dsData, canData };
}
