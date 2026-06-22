import type { CANCurrentPoint, DSVoltagePoint } from "./types";

/**
 * Generate synthetic match data for demo purposes.
 * Simulates ~160s match with realistic voltage sag, current profiles,
 * and per-channel PDH current for 24 channels.
 */
export function generateDemoData(): {
  dsData: DSVoltagePoint[];
  canData: CANCurrentPoint[];
  channels: Record<string, number[]>;
} {
  const dsData: DSVoltagePoint[] = [];
  const canData: CANCurrentPoint[] = [];
  const chArrays: number[][] = Array.from({ length: 24 }, () => []);

  let soc = 0.91;
  let t = 0;

  for (let i = 0; i < 8000; i++) {
    const isAuto = i >= 250 && i < 1000;
    const isTeleop = i >= 1000;

    let load: number;
    if (i < 250) {
      load = 8 + Math.random() * 4;
    } else if (isAuto) {
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

    dsData.push({ t: Number(t.toFixed(3)), v: Number(v.toFixed(4)) });

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

    // Per-channel synthetic currents
    const drive = isAuto || isTeleop ? load * 0.12 : load * 0.03;
    const turn  = isAuto || isTeleop ? load * 0.03 : 0.5;
    const arm   = isTeleop && Math.random() < 0.4 ? load * 0.08 : 1;
    const intake = isTeleop && Math.random() < 0.3 ? load * 0.04 : 0.5;
    const shooter = isTeleop && Math.random() < 0.25 ? load * 0.1 : 0.2;
    const climber = i > 7200 ? load * 0.15 : 0;
    const rand = (s: number) => Math.max(0, (Math.random() - 0.4) * s);

    // CH 0-3: drive motors
    for (let ch = 0; ch < 4; ch++) chArrays[ch]!.push(+(drive + rand(4)).toFixed(2));
    // CH 4-7: turn motors
    for (let ch = 4; ch < 8; ch++) chArrays[ch]!.push(+(turn + rand(1.5)).toFixed(2));
    // CH 8-9: arm pivot
    for (let ch = 8; ch < 10; ch++) chArrays[ch]!.push(+(arm + rand(2)).toFixed(2));
    // CH 10-11: arm extend / wrist
    for (let ch = 10; ch < 12; ch++) chArrays[ch]!.push(+(arm * 0.7 + rand(1.5)).toFixed(2));
    // CH 12-13: intake
    for (let ch = 12; ch < 14; ch++) chArrays[ch]!.push(+(intake + rand(1)).toFixed(2));
    // CH 14-15: shooter flywheel
    for (let ch = 14; ch < 16; ch++) chArrays[ch]!.push(+(shooter + rand(2)).toFixed(2));
    // CH 16-17: climber
    for (let ch = 16; ch < 18; ch++) chArrays[ch]!.push(+(climber + rand(1)).toFixed(2));
    // CH 18: feeder
    chArrays[18]!.push(+(intake * 0.5 + rand(0.5)).toFixed(2));
    // CH 19: spare
    chArrays[19]!.push(0);
    // CH 20: compressor (cycles on ~30% of the time)
    chArrays[20]!.push(Math.sin(i * 0.03) > 0.4 ? +(18 + rand(2)).toFixed(2) : 0);
    // CH 21: LED
    chArrays[21]!.push(+(0.8 + rand(0.2)).toFixed(2));
    // CH 22: vision co-processor
    chArrays[22]!.push(+(4.5 + rand(0.5)).toFixed(2));
    // CH 23: radio (always-on)
    chArrays[23]!.push(+(2.8 + rand(0.3)).toFixed(2));

    soc -= load * 1e-7;
    t += 0.02;
  }

  const channels: Record<string, number[]> = {};
  for (let ch = 0; ch < 24; ch++) {
    channels[`CH ${ch}`] = chArrays[ch]!;
  }

  return { dsData, canData, channels };
}
