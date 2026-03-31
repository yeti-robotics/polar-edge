import type { ChartData, ChartOptions } from "chart.js";
import { useCallback, useMemo, useState } from "react";
import { computeVoltageStats } from "@/services/analysis/battery";
import { downloadVoltageCSV } from "@/services/analysis/csv-export";
import { formatEquation, regressionLine } from "@/services/analysis/regression";
import { rollingMin } from "@/services/analysis/rolling";
import type { MergedData } from "@/services/analysis/types";
import { ChartCard, type SeriesToggle } from "./ChartCard";
import { StatCard } from "./StatCard";

// YETI dark mode chart palette
const CHART_COLORS = {
  raw: "oklch(0.696 0.17 162.48)", // chart-2 teal
  roll: "oklch(0.769 0.188 70.08)", // chart-3 yellow
  reg: "oklch(0.627 0.265 303.9)", // chart-4 magenta
};

const TICK_STYLE = {
  color: "oklch(0.552 0.016 285.938)", // muted-foreground
  font: { family: "ui-monospace, monospace", size: 10 },
};

interface VoltageSectionProps {
  data: MergedData;
  ocv: number;
}

function windowLabel(w: number, dt: number): string {
  const s = w * dt;
  return s < 1 ? `${s.toFixed(2)}s` : `${s.toFixed(1)}s`;
}

export function VoltageSection({ data, ocv }: VoltageSectionProps) {
  const [window, setWindow] = useState(5);
  const [toggles, setToggles] = useState({
    raw: true,
    roll: true,
    reg: true,
  });

  const stats = useMemo(() => computeVoltageStats(data.volts, ocv, data.dt), [data, ocv]);

  const rollV = useMemo(
    () => rollingMin(new Float64Array(data.volts), window),
    [data.volts, window]
  );

  const { reg } = useMemo(() => {
    return regressionLine(data.times, data.volts);
  }, [data]);

  const chartData = useMemo<ChartData<"line">>(() => {
    const step = Math.max(1, Math.floor(data.times.length / 900));
    const labels: number[] = [];
    const rawVals: number[] = [];
    const rollVals: number[] = [];
    const regVals: number[] = [];

    for (let i = 0; i < data.times.length; i += step) {
      labels.push(Number(data.times[i]?.toFixed(2)));
      rawVals.push(Number(data.volts[i]?.toFixed(4)));
      rollVals.push(Number(rollV[i]?.toFixed(4)));
      regVals.push(Number((reg.m * (data.times[i] ?? 0) + reg.b).toFixed(4)));
    }

    return {
      labels,
      datasets: [
        {
          type: "line" as const,
          label: "Raw voltage",
          data: rawVals,
          borderColor: CHART_COLORS.raw,
          borderWidth: 1.2,
          pointRadius: 0,
          fill: false,
          tension: 0.04,
        },
        {
          type: "line" as const,
          label: "Rolling min",
          data: rollVals,
          borderColor: CHART_COLORS.roll,
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          tension: 0.1,
        },
        {
          type: "line" as const,
          label: "Regression",
          data: regVals,
          borderColor: CHART_COLORS.reg,
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          tension: 0,
          borderDash: [6, 4],
        },
      ],
    };
  }, [data, rollV, reg]);

  const chartOptions = useMemo<ChartOptions>(
    () => ({
      scales: {
        x: {
          ticks: { ...TICK_STYLE, maxTicksLimit: 12 },
          grid: { color: "oklch(1 0 0 / 0.04)" },
        },
        y: {
          ticks: TICK_STYLE,
          grid: { color: "oklch(1 0 0 / 0.04)" },
          title: {
            display: true,
            text: "V",
            color: TICK_STYLE.color,
            font: { size: 10, family: "ui-monospace, monospace" },
          },
        },
      },
    }),
    []
  );

  const seriesToggle: SeriesToggle[] = [
    {
      key: "raw",
      label: "Raw voltage",
      color: CHART_COLORS.raw,
      active: toggles.raw,
    },
    {
      key: "roll",
      label: "Rolling min",
      color: CHART_COLORS.roll,
      active: toggles.roll,
    },
    {
      key: "reg",
      label: "Regression",
      color: CHART_COLORS.reg,
      active: toggles.reg,
    },
  ];

  const handleToggle = useCallback((key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  }, []);

  const f2 = (v: number) => (Number.isNaN(v) ? "—" : v.toFixed(2));

  return (
    <section className="scroll-mt-14 border-b border-border px-7 py-10" id="s-voltage">
      <div className="mx-auto max-w-[1300px]">
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-primary">
            01
          </span>
          <h2 className="text-xl font-medium">Voltage</h2>
        </div>

        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
          Voltage sourced from the DS log.{" "}
          <strong className="text-foreground">Rolling window</strong> uses a causal minimum
          (worst-case dip) to expose brownout events. The{" "}
          <strong className="text-foreground">regression line</strong> shows the overall depletion
          trend.
        </p>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            label="Min voltage"
            value={f2(stats.min)}
            unit="V"
            note="The lowest voltage point recorded"
            color={stats.min >= 8.5 ? "green" : stats.min >= 7.5 ? "yellow" : "red"}
          />
          <StatCard
            label="OCV estimate"
            value={f2(stats.ocv)}
            unit="V"
            note="Battery's resting voltage level"
            color="blue"
          />
          <StatCard
            label="Mean voltage"
            value={f2(stats.mean)}
            unit="V"
            note="Typical voltage during the match"
            color={stats.mean >= 11 ? "green" : stats.mean >= 10 ? "yellow" : "red"}
          />
          <StatCard
            label="< 8.5V time"
            value={f2(stats.timeBelow85)}
            unit="s"
            note="Time motors were weak"
            color={stats.timeBelow85 === 0 ? "green" : stats.timeBelow85 < 1 ? "yellow" : "red"}
          />
          <StatCard
            label="< 6.3V time"
            value={f2(stats.timeBelow63)}
            unit="s"
            note="Time communication was at risk"
            color={stats.timeBelow63 === 0 ? "green" : "red"}
          />
        </div>

        <ChartCard
          title="Voltage over time"
          subtitle="DS log terminal voltage. Horizontal dashed lines: 6.3V radio brownout · 8.5V motor torque loss."
          data={chartData}
          options={chartOptions}
          thresholds={[
            { y: 6.3, color: "oklch(0.645 0.246 16.439 / 0.55)", label: "6.3V radio" },
            { y: 8.5, color: "oklch(0.769 0.188 70.08 / 0.45)", label: "8.5V motors" },
          ]}
          toggles={seriesToggle}
          onToggle={handleToggle}
          windowValue={window}
          windowLabel={windowLabel(window, data.dt)}
          onWindowChange={setWindow}
          equation={`Regression: ${formatEquation(reg, "t", "V")}`}
          onDownload={() => downloadVoltageCSV(data.times, data.volts, rollV, reg)}
        />
      </div>
    </section>
  );
}
