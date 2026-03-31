import type { ChartData, ChartOptions } from "chart.js";
import { useCallback, useMemo, useState } from "react";
import { computePowerStats } from "@/services/analysis/battery";
import { downloadPowerCSV } from "@/services/analysis/csv-export";
import { formatEquation, regressionLine } from "@/services/analysis/regression";
import { rollingMean } from "@/services/analysis/rolling";
import type { MergedData } from "@/services/analysis/types";
import { ChartCard, type SeriesToggle } from "./ChartCard";
import { StatCard } from "./StatCard";

// YETI dark mode chart palette
const COLORS = {
  raw: "oklch(0.627 0.265 303.9 / 0.4)", // chart-4 magenta (semi-transparent)
  rawSolid: "oklch(0.627 0.265 303.9)", // chart-4 magenta
  reg: "oklch(0.696 0.17 162.48)", // chart-2 teal
};

const TICK_STYLE = {
  color: "oklch(0.552 0.016 285.938)",
  font: { family: "ui-monospace, monospace", size: 10 },
};

interface PowerSectionProps {
  data: MergedData;
  power: number[];
}

function windowLabel(w: number, dt: number): string {
  const s = w * dt;
  return s < 1 ? `${s.toFixed(2)}s` : `${s.toFixed(1)}s`;
}

export function PowerSection({ data, power }: PowerSectionProps) {
  const [window, setWindow] = useState(25);
  const [toggles, setToggles] = useState({
    raw: true,
    roll: true,
    reg: true,
  });

  const safePow = useMemo(() => power.map((p) => (Number.isNaN(p) ? 0 : p)), [power]);

  const stats = useMemo(() => computePowerStats(power, data.dt), [power, data.dt]);

  const rollP = useMemo(() => rollingMean(new Float64Array(safePow), window), [safePow, window]);

  const { reg } = useMemo(() => regressionLine(data.times, safePow), [data.times, safePow]);

  const chartData = useMemo<ChartData<"line">>(() => {
    const step = Math.max(1, Math.floor(data.times.length / 900));
    const labels: number[] = [];
    const rawVals: number[] = [];
    const rollVals: number[] = [];
    const regVals: number[] = [];

    for (let i = 0; i < data.times.length; i += step) {
      labels.push(Number(data.times[i]?.toFixed(2)));
      rawVals.push(Number(safePow[i]?.toFixed(1)));
      rollVals.push(Number(rollP[i]?.toFixed(1)));
      regVals.push(Number((reg.m * (data.times[i] ?? 0) + reg.b).toFixed(1)));
    }

    return {
      labels,
      datasets: [
        {
          type: "line" as const,
          label: "Raw power",
          data: rawVals,
          borderColor: COLORS.raw,
          borderWidth: 1.2,
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
          type: "line" as const,
          label: "Regression",
          data: regVals,
          borderColor: COLORS.reg,
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          tension: 0,
          borderDash: [6, 4],
        },
      ],
    };
  }, [data, safePow, rollP, reg]);

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
            text: "W",
            color: TICK_STYLE.color,
            font: { size: 10, family: "ui-monospace, monospace" },
          },
        },
      },
    }),
    []
  );

  const seriesToggle: SeriesToggle[] = [
    { key: "raw", label: "Raw power", color: COLORS.rawSolid, active: toggles.raw },
    { key: "roll", label: "Rolling mean", color: COLORS.rawSolid, active: toggles.roll },
    { key: "reg", label: "Regression", color: COLORS.reg, active: toggles.reg },
  ];

  const handleToggle = useCallback((key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  }, []);

  const f0 = (v: number) => (Number.isNaN(v) ? "—" : Math.round(v).toString());
  const f2 = (v: number) => (Number.isNaN(v) ? "—" : v.toFixed(2));
  const f1 = (v: number) => (Number.isNaN(v) ? "—" : v.toFixed(1));

  if (!data.hasCurrent) {
    return (
      <section className="scroll-mt-14 border-b border-border px-7 py-10" id="s-power">
        <div className="mx-auto max-w-[1300px]">
          <div className="mb-6 flex items-center gap-3">
            <span className="rounded border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-primary">
              03
            </span>
            <h2 className="text-xl font-medium">Power</h2>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            No CAN JSON loaded — power data unavailable.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="scroll-mt-14 border-b border-border px-7 py-10" id="s-power">
      <div className="mx-auto max-w-[1300px]">
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-primary">
            03
          </span>
          <h2 className="text-xl font-medium">Power</h2>
        </div>

        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
          Instantaneous power{" "}
          <span className="inline-flex items-baseline gap-0.5 rounded border border-border bg-card px-2 py-0.5 font-mono text-xs text-foreground">
            <i>P</i> = <i>V</i> × <i>I</i>
          </span>{" "}
          using DS log voltage and summed current. The regression line shows whether power demand
          trends up or remains flat.
        </p>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard
            label="Peak power"
            value={f0(stats.peak)}
            unit="W"
            note="Highest instantaneous W"
            color={stats.peak < 2000 ? "green" : stats.peak < 3000 ? "yellow" : "red"}
          />
          <StatCard
            label="Mean power"
            value={f0(stats.mean)}
            unit="W"
            note="Average demand"
            color={stats.mean < 800 ? "green" : stats.mean < 1200 ? "yellow" : "red"}
          />
          <StatCard
            label="Total energy"
            value={f2(stats.totalWh)}
            unit="Wh"
            note="Used this match"
            color={stats.totalWh < 108 ? "green" : stats.totalWh < 151 ? "yellow" : "red"}
          />
          <StatCard
            label="% of 216Wh"
            value={f1(stats.percentOfCapacity)}
            unit="%"
            note="Battery capacity used"
            color={
              stats.percentOfCapacity < 50
                ? "green"
                : stats.percentOfCapacity < 70
                  ? "yellow"
                  : "red"
            }
          />
        </div>

        <ChartCard
          title="Power over time"
          subtitle="P = V × I. Dashed: 1500W sustained warning."
          data={chartData}
          options={chartOptions}
          thresholds={[{ y: 1500, color: "oklch(0.769 0.188 70.08 / 0.5)", label: "1500W" }]}
          toggles={seriesToggle}
          onToggle={handleToggle}
          windowValue={window}
          windowLabel={windowLabel(window, data.dt)}
          onWindowChange={setWindow}
          equation={`Regression: ${formatEquation(reg, "t", "P")}`}
          onDownload={() => downloadPowerCSV(data.times, power, rollP, reg)}
        />
      </div>
    </section>
  );
}
