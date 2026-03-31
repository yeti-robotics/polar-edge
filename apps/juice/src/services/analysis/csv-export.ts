import type { ImpedanceSample, RegressionResult } from "./types";

function triggerDownload(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadVoltageCSV(
  times: number[],
  volts: number[],
  rollV: Float64Array,
  reg: RegressionResult
) {
  const header = "time_s,voltage_V,rolling_min_V,regression_V";
  const rows = times.map(
    (t, i) =>
      `${t.toFixed(3)},${volts[i]!.toFixed(4)},${rollV[i]!.toFixed(4)},${(reg.m * t + reg.b).toFixed(4)}`
  );
  triggerDownload([header, ...rows].join("\n"), "frc_battery_voltage.csv");
}

export function downloadCurrentCSV(
  times: number[],
  currents: number[],
  rollC: Float64Array,
  peakSet: Set<number>
) {
  const header = "time_s,current_A,rolling_mean_A,is_peak";
  const safeCurr = currents.map((c) =>
    Number.isNaN(c) ? 0 : Math.max(0, c)
  );
  const rows = times.map(
    (t, i) =>
      `${t.toFixed(3)},${safeCurr[i]!.toFixed(2)},${rollC[i]!.toFixed(2)},${peakSet.has(i) ? 1 : 0}`
  );
  triggerDownload([header, ...rows].join("\n"), "frc_battery_current.csv");
}

export function downloadPowerCSV(
  times: number[],
  power: number[],
  rollP: Float64Array,
  reg: RegressionResult
) {
  const header = "time_s,power_W,rolling_mean_W,regression_W";
  const safePow = power.map((p) => (Number.isNaN(p) ? 0 : p));
  const rows = times.map(
    (t, i) =>
      `${t.toFixed(3)},${safePow[i]!.toFixed(1)},${rollP[i]!.toFixed(1)},${(reg.m * t + reg.b).toFixed(1)}`
  );
  triggerDownload([header, ...rows].join("\n"), "frc_battery_power.csv");
}

export function downloadImpedanceCSV(
  samples: ImpedanceSample[],
  rollI: Float64Array,
  reg: RegressionResult
) {
  const header =
    "time_s,voltage_V,current_A,sag_V,impedance_mohm,rolling_median_mohm,regression_mohm";
  const rows = samples.map(
    (s, i) =>
      `${s.t.toFixed(3)},${s.v.toFixed(4)},${s.c.toFixed(2)},${s.sag.toFixed(4)},${s.R.toFixed(3)},${rollI[i]!.toFixed(3)},${(reg.m * s.t + reg.b).toFixed(3)}`
  );
  triggerDownload(
    [header, ...rows].join("\n"),
    "frc_battery_impedance.csv"
  );
}
