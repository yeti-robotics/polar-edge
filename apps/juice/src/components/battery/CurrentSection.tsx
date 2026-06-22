import type { ChartData, ChartOptions } from "chart.js";
import { useCallback, useMemo, useState } from "react";
import { computeCurrentStats, findCurrentPeaks } from "@/services/analysis/battery";
import { downloadCurrentCSV } from "@/services/analysis/csv-export";
import { formatEquation, regressionLine } from "@/services/analysis/regression";
import { rollingMean } from "@/services/analysis/rolling";
import type { MergedData } from "@/services/analysis/types";
import { ChartCard, type SeriesToggle } from "./ChartCard";
import { StatCard } from "./StatCard";

const COLORS = {
  raw: "oklch(0.7366 0.1138 232.04 / 0.5)",
  rawSolid: "oklch(0.7366 0.1138 232.04)",
  peaks: "oklch(0.645 0.246 16.439 / 0.7)",
  reg: "oklch(0.627 0.265 303.9)",
};

const TICK_STYLE = {
  color: "oklch(0.552 0.016 285.938)",
  font: { family: "ui-monospace, monospace", size: 10 },
};

interface CurrentSectionProps {
  data: MergedData;
}

function windowLabel(w: number, dt: number): string {
  const s = w * dt;
  return s < 1 ? `${s.toFixed(2)}s` : `${s.toFixed(1)}s`;
}

export function CurrentSection({ data }: CurrentSectionProps) {
  const [window, setWindow] = useState(5);
  const [toggles, setToggles] = useState({
    raw: true,
    roll: true,
    peaks: true,
    reg: true,
  });

  const safeCurr = useMemo(
    () => data.currents.map((c) => (Number.isNaN(c) ? 0 : Math.max(0, c))),
    [data.currents]
  );

  const stats = useMemo(() => computeCurrentStats(data.currents), [data.currents]);

  const peakIdx = useMemo(() => findCurrentPeaks(data.currents, data.dt), [data.currents, data.dt]);

  const rollC = useMemo(() => rollingMean(new Float64Array(safeCurr), window), [safeCurr, window]);

  const { reg } = useMemo(() => {
    const pTimes = peakIdx.map((i) => data.times[i] ?? 0);
    const pVals = peakIdx.map((i) => safeCurr[i] ?? 0);
    return regressionLine(pTimes, pVals);
  }, [peakIdx, data.times, safeCurr]);

  const chartData = useMemo<ChartData<"line" | "scatter">>(() => {
    const step = Math.max(1, Math.floor(data.times.length / 900));
    const labels: number[] = [];
    const rawVals: number[] = [];
    const rollVals: number[] = [];

    for (let i = 0; i < data.times.length; i += step) {
      labels.push(Number(data.times[i]?.toFixed(2)));
      rawVals.push(Number(safeCurr[i]?.toFixed(2)));
      rollVals.push(Number(rollC[i]?.toFixed(2)));
    }

    const scatterPts = peakIdx.map((i) => ({
      x: Number(data.times[i]?.toFixed(2)),
      y: Number(safeCurr[i]?.toFixed(2)),
    }));

    const regPts =
      data.times.length > 0
        ? [
            { x: data.times[0] ?? 0, y: reg.m * (data.times[0] ?? 0) + reg.b },
            {
              x: data.times[data.times.length - 1] ?? 0,
              y: reg.m * (data.times[data.times.length - 1] ?? 0) + reg.b,
            },
          ]
        : [];

    const datasets: ChartData<"line" | "scatter">["datasets"] = [
      {
        type: "line" as const,
        label: "Total current",
        data: rawVals,
        borderColor: COLORS.raw,
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        tension: 0.04,
      },
      {
        type: "line" as const,
        label: "Rolling mean",
        data: rollVals,
        borderColor: COLORS.rawSolid,
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.1,
      },
      {
        type: "scatter" as const,
        label: "Peak scatter",
        data: scatterPts,
        backgroundColor: COLORS.peaks,
        pointRadius: 3,
      },
      {
        type: "line" as const,
        label: "Regression",
        data: regPts,
        borderColor: COLORS.reg,
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0,
        borderDash: [6, 4],
        parsing: { xAxisKey: "x", yAxisKey: "y" },
      },
    ];

    return { labels, datasets };
  }, [data, safeCurr, rollC, peakIdx, reg, window]);

  const chartOptions = useMemo<ChartOptions>(
    () => ({
      scales: {
        x: {
          ticks: { ...TICK_STYLE, maxTicksLimit: 12 },
          grid: { color: "oklch(1 0 0 / 0.04)" },
        },
        y: {
          min: 0,
          ticks: TICK_STYLE,
          grid: { color: "oklch(1 0 0 / 0.04)" },
          title: {
            display: true,
            text: "A",
            color: TICK_STYLE.color,
            font: { size: 10, family: "ui-monospace, monospace" },
          },
        },
      },
    }),
    []
  );

  const seriesToggle: SeriesToggle[] = [
    { key: "raw", label: "Total current", color: COLORS.rawSolid, active: toggles.raw },
    { key: "roll", label: "Rolling mean", color: COLORS.rawSolid, active: toggles.roll },
    { key: "peaks", label: "Peak scatter", color: "oklch(0.645 0.246 16.439)", active: toggles.peaks },
    { key: "reg", label: "Regression (peaks)", color: COLORS.reg, active: toggles.reg },
  ];

  const handleToggle = useCallback((key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  }, []);

  const f1 = (v: number) => (Number.isNaN(v) ? "—" : v.toFixed(1));

  if (!data.hasCurrent) {
    return (
      <section className="scroll-mt-14 border-b border-border px-7 py-10" id="s-current">
        <div className="mx-auto max-w-[1300px]">
          <div className="mb-6 flex items-center gap-3">
            <span className="rounded border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-primary">
              02
            </span>
            <h2 className="text-xl font-medium">Current</h2>
          </div>
          <p className="font-mono text-xs text-muted-foreground">No current data available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="scroll-mt-14 border-b border-border px-7 py-10" id="s-current">
      <div className="mx-auto max-w-[1300px]">
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-primary">
            02
          </span>
          <h2 className="text-xl font-medium">Current</h2>
        </div>

        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
          Current is the{" "}
          <strong className="text-foreground">sum of all PDP/PDH channel currents</strong>. Relative
          maxima (local peaks) are plotted as scatter to visualize spike events.
        </p>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <StatCard
            label="Peak current"
            value={f1(stats.peak)}
            unit="A"
            note="Highest summed sample"
            color={stats.peak < 120 ? "green" : stats.peak < 160 ? "yellow" : "red"}
          />
          <StatCard
            label="Mean current"
            value={f1(stats.mean)}
            unit="A"
            note="Average demand"
            color={stats.mean < 60 ? "green" : stats.mean < 90 ? "yellow" : "red"}
          />
          <StatCard
            label="> 120A samples"
            value={String(stats.samplesAbove120)}
            unit=""
            note="Above main breaker threshold"
            color={stats.samplesAbove120 === 0 ? "green" : "red"}
          />
        </div>

        <ChartCard
          title="Current over time"
          subtitle="Summed PDP/PDH channel currents. Scatter = local maxima above 30A. Dashed: 120A main breaker · 160A critical."
          data={chartData}
          options={chartOptions}
          thresholds={[
            { y: 120, color: "oklch(0.769 0.188 70.08 / 0.6)", label: "120A breaker" },
            { y: 160, color: "oklch(0.645 0.246 16.439 / 0.6)", label: "160A critical" },
          ]}
          toggles={seriesToggle}
          onToggle={handleToggle}
          windowValue={window}
          windowLabel={windowLabel(window, data.dt)}
          onWindowChange={setWindow}
          equation={`Regression (peaks): ${formatEquation(reg, "t", "I")}`}
          onDownload={() => downloadCurrentCSV(data.times, data.currents, rollC, new Set(peakIdx))}
        />
      </div>
    </section>
  );
}
