import { useCallback, useMemo, useState } from "react";
import type { ChartData, ChartOptions } from "chart.js";
import { rollingMean } from "@/services/analysis/rolling";
import {
  formatEquation,
  regressionLine,
} from "@/services/analysis/regression";
import {
  computeCurrentStats,
  findCurrentPeaks,
} from "@/services/analysis/battery";
import { downloadCurrentCSV } from "@/services/analysis/csv-export";
import type { MergedData } from "@/services/analysis/types";
import { StatCard } from "./StatCard";
import { ChartCard, type SeriesToggle } from "./ChartCard";

// YETI dark mode chart palette
const COLORS = {
  raw: "oklch(0.7366 0.1138 232.04 / 0.5)", // yeti-400 (semi-transparent)
  rawSolid: "oklch(0.7366 0.1138 232.04)",   // yeti-400
  peaks: "oklch(0.645 0.246 16.439 / 0.7)",  // chart-5 red
  reg: "oklch(0.627 0.265 303.9)",           // chart-4 magenta
};

// Distinct colors for per-channel lines
const CHANNEL_COLORS = [
  "oklch(0.696 0.17 162.48)",    // chart-2 teal
  "oklch(0.769 0.188 70.08)",    // chart-3 yellow
  "oklch(0.627 0.265 303.9)",    // chart-4 magenta
  "oklch(0.645 0.246 16.439)",   // chart-5 red
  "oklch(0.488 0.243 264.376)",  // chart-1 purple
  "oklch(0.7366 0.1138 232.04)", // yeti-400
  "oklch(0.8135 0.0831 232.31)", // yeti-300
  "oklch(0.5538 0.1209 240.68)", // yeti-600
  "oklch(0.768 0.165 54)",       // warning
  "oklch(0.704 0.191 22.216)",   // destructive
  "oklch(0.6 0.118 184.704)",    // light chart-2
  "oklch(0.828 0.189 84.429)",   // light chart-4
  "oklch(0.646 0.222 41.116)",   // light chart-1
  "oklch(0.398 0.07 227.392)",   // light chart-3
  "oklch(0.769 0.188 70.08)",    // chart-3
  "oklch(0.4747 0.1025 241.12)", // yeti-700
];

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

  const channelNames = useMemo(
    () => Object.keys(data.channels).sort((a, b) => {
      const numA = Number.parseInt(a.replace(/\D/g, ""), 10);
      const numB = Number.parseInt(b.replace(/\D/g, ""), 10);
      return numA - numB;
    }),
    [data.channels]
  );

  const [enabledChannels, setEnabledChannels] = useState<Set<string>>(
    () => new Set<string>()
  );

  const safeCurr = useMemo(
    () => data.currents.map((c) => (Number.isNaN(c) ? 0 : Math.max(0, c))),
    [data.currents]
  );

  const stats = useMemo(
    () => computeCurrentStats(data.currents),
    [data.currents]
  );

  const peakIdx = useMemo(
    () => findCurrentPeaks(data.currents, data.dt),
    [data.currents, data.dt]
  );

  const rollC = useMemo(
    () => rollingMean(new Float64Array(safeCurr), window),
    [safeCurr, window]
  );

  const { reg } = useMemo(() => {
    const pTimes = peakIdx.map((i) => data.times[i]!);
    const pVals = peakIdx.map((i) => safeCurr[i]!);
    return regressionLine(pTimes, pVals);
  }, [peakIdx, data.times, safeCurr]);

  const chartData = useMemo<ChartData<"line" | "scatter">>(() => {
    const step = Math.max(1, Math.floor(data.times.length / 900));
    const labels: number[] = [];
    const rawVals: number[] = [];
    const rollVals: number[] = [];

    for (let i = 0; i < data.times.length; i += step) {
      labels.push(Number(data.times[i]!.toFixed(2)));
      rawVals.push(Number(safeCurr[i]!.toFixed(2)));
      rollVals.push(Number(rollC[i]!.toFixed(2)));
    }

    const scatterPts = peakIdx.map((i) => ({
      x: Number(data.times[i]!.toFixed(2)),
      y: Number(safeCurr[i]!.toFixed(2)),
    }));

    const regPts =
      data.times.length > 0
        ? [
            { x: data.times[0]!, y: reg.m * data.times[0]! + reg.b },
            {
              x: data.times[data.times.length - 1]!,
              y: reg.m * data.times[data.times.length - 1]! + reg.b,
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

    // Add per-channel lines for enabled channels (with rolling window applied)
    for (const chName of channelNames) {
      if (!enabledChannels.has(chName)) continue;
      const chData = data.channels[chName]!;
      const smoothed = rollingMean(new Float64Array(chData), window);
      const chVals: number[] = [];
      for (let i = 0; i < chData.length; i += step) {
        chVals.push(Number(smoothed[i]!.toFixed(2)));
      }
      const colorIdx = channelNames.indexOf(chName) % CHANNEL_COLORS.length;
      datasets.push({
        type: "line" as const,
        label: chName,
        data: chVals,
        borderColor: CHANNEL_COLORS[colorIdx]!,
        borderWidth: 1.2,
        pointRadius: 0,
        fill: false,
        tension: 0.04,
      });
    }

    return { labels, datasets };
  }, [data, safeCurr, rollC, peakIdx, reg, channelNames, enabledChannels, window]);

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

  // Build toggles: base series + channel toggles handled separately
  const seriesToggle: SeriesToggle[] = [
    { key: "raw", label: "Total current", color: COLORS.rawSolid, active: toggles.raw },
    { key: "roll", label: "Rolling mean", color: COLORS.rawSolid, active: toggles.roll },
    { key: "peaks", label: "Peak scatter", color: "oklch(0.645 0.246 16.439)", active: toggles.peaks },
    { key: "reg", label: "Regression (peaks)", color: COLORS.reg, active: toggles.reg },
  ];

  const handleToggle = useCallback((key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  }, []);

  const toggleChannel = useCallback((chName: string) => {
    setEnabledChannels((prev) => {
      const next = new Set(prev);
      if (next.has(chName)) next.delete(chName);
      else next.add(chName);
      return next;
    });
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
          <p className="font-mono text-xs text-muted-foreground">
            No current data available.
          </p>
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
          <strong className="text-foreground">
            sum of all PDP/PDH channel currents
          </strong>
          . Relative maxima (local peaks) are plotted as scatter to
          visualize spike events.
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

        {/* Per-channel filter */}
        {channelNames.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-border bg-card/50 p-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Channels
            </span>
            {channelNames.map((ch) => {
              const active = enabledChannels.has(ch);
              const colorIdx = channelNames.indexOf(ch) % CHANNEL_COLORS.length;
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => toggleChannel(ch)}
                  className="rounded border px-2 py-0.5 font-mono text-[10px] transition-colors"
                  style={{
                    backgroundColor: active ? CHANNEL_COLORS[colorIdx] : "transparent",
                    color: active ? "var(--background)" : "var(--muted-foreground)",
                    borderColor: active ? CHANNEL_COLORS[colorIdx] : "var(--border)",
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  {ch}
                </button>
              );
            })}
          </div>
        )}

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
          onDownload={() =>
            downloadCurrentCSV(
              data.times,
              data.currents,
              rollC,
              new Set(peakIdx)
            )
          }
        />
      </div>
    </section>
  );
}
