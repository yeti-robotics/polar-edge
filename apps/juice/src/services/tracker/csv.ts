import type { BatterySession } from "./types";

export function exportSessionsCsv(sessions: BatterySession[]): void {
  if (!sessions.length) return;

  const rows = [
    ["Battery", "Checkout Time", "Checkin Time", "KW700 (mOhm)", "Voltage (V)", "Performance", "Brownout", "Brownout Time", "Notes"],
    ...sessions.map((s) => [
      s.batteryName,
      s.checkedOutAt,
      s.checkedInAt ?? "",
      s.kw700MOhms?.toString() ?? "",
      s.voltage?.toString() ?? "",
      s.performance ?? "",
      s.hadBrownout === true ? "yes" : s.hadBrownout === false ? "no" : "",
      s.brownoutTiming ?? "",
      s.notes,
    ]),
  ];

  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `battery-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
