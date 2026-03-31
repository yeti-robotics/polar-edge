import { useCallback, useMemo, useState } from "react";
import type { ChartData, ChartOptions } from "chart.js";
import { rollingMedian } from "@/services/analysis/rolling";
import {
  formatEquation,
  linearRegression,
} from "@/services/analysis/regression";
import { computeImpedanceStats } from "@/services/analysis/battery";
import { downloadImpedanceCSV } from "@/services/analysis/csv-export";
import type { ImpedanceSample } from "@/services/analysis/types";
import { StatCard } from "./StatCard";
import { ChartCard, type SeriesToggle } from "./ChartCard";

// YETI dark mode chart palette
const COLORS = {
  bar: "oklch(0.769 0.188 70.08)",          // chart-3 yellow
  roll: "oklch(0.769 0.188 70.08)",         // chart-3 yellow
  reg: "oklch(0.696 0.17 162.48)",          // chart-2 teal
  vscat: "oklch(0.488 0.243 264.376 / 0.4)", // chart-1 purple
};

const TICK_STYLE = {
  color: "oklch(0.552 0.016 285.938)",
  font: { family: "ui-monospace, monospace", size: 10 },
};

interface ImpedanceSectionProps {
  samples: ImpedanceSample[];
  dt: number;
}

function windowLabel(w: number, dt: number): string {
  const s = w * dt;
  return s < 1 ? `${s.toFixed(2)}s` : `${s.toFixed(1)}s`;
}

export function ImpedanceSection({ samples, dt }: ImpedanceSectionProps) {
  const [window, setWindow] = useState(25);
  const [toggles, setToggles] = useState({
    raw: true,
    roll: true,
    reg: true,
    vscat: true,
  });

  const stats = useMemo(
    () => computeImpedanceStats(samples),
    [samples]
  );

  const iT = useMemo(() => samples.map((s) => s.t), [samples]);
  const iR = useMemo(
    () => samples.map((s) => Number(s.R.toFixed(3))),
    [samples]
  );

  const rollI = useMemo(
    () => rollingMedian(new Float64Array(iR), Math.max(1, window)),
    [iR, window]
  );

  const reg = useMemo(
    () => linearRegression(iT, iR),
    [iT, iR]
  );

  const chartData = useMemo<ChartData<"line" | "bar" | "scatter">>(() => {
    const labels = iT.map((t) => Number(t.toFixed(2)));

    const barColors = iR.map((r) =>
      r < 18
        ? "oklch(0.696 0.17 162.48 / 0.6)"     // teal = good
        : r < 28
          ? "oklch(0.769 0.188 70.08 / 0.65)"   // yellow = warning
          : "oklch(0.645 0.246 16.439 / 0.7)"    // red = bad
    );

    const regLine = iT.map((t) =>
      Number((reg.m * t + reg.b).toFixed(3))
    );

    const vScatPts = samples.map((s) => ({
      x: Number(s.t.toFixed(2)),
      y: Number(s.v.toFixed(4)),
    }));

    return {
      labels,
      datasets: [
        {
          type: "bar" as const,
          label: "Impedance (mΩ)",
          data: iR,
          backgroundColor: barColors,
          borderWidth: 0,
          barPercentage: 1.4,
          categoryPercentage: 1.4,
          yAxisID: "yR",
        },
        {
          type: "line" as const,
          label: "Rolling median",
          data: Array.from(rollI),
          borderColor: COLORS.roll,
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          tension: 0.3,
          yAxisID: "yR",
        },
        {
          type: "line" as const,
          label: "Regression",
          data: regLine,
          borderColor: COLORS.reg,
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          tension: 0,
          borderDash: [6, 4],
          yAxisID: "yR",
        },
        {
          type: "scatter" as const,
          label: "Voltage @ peaks",
          data: vScatPts,
          backgroundColor: COLORS.vscat,
          pointRadius: 3,
          yAxisID: "yV2",
          parsing: { xAxisKey: "x", yAxisKey: "y" },
        },
      ],
    };
  }, [iT, iR, rollI, reg, samples]);

  const chartOptions = useMemo<ChartOptions>(() => {
    const maxR = iR.length ? Math.max(...iR) : 50;
    return {
      scales: {
        x: {
          ticks: { ...TICK_STYLE, maxTicksLimit: 12 },
          grid: { color: "oklch(1 0 0 / 0.04)" },
        },
        yR: {
          position: "left" as const,
          min: 0,
          max: Math.min(100, maxR * 1.15),
          ticks: TICK_STYLE,
          grid: { color: "oklch(1 0 0 / 0.04)" },
          title: {
            display: true,
            text: "mΩ",
            color: TICK_STYLE.color,
            font: { size: 10, family: "ui-monospace, monospace" },
          },
        },
        yV2: {
          position: "right" as const,
          ticks: TICK_STYLE,
          grid: { display: false },
          title: {
            display: true,
            text: "V @ peak",
            color: TICK_STYLE.color,
            font: { size: 10, family: "ui-monospace, monospace" },
          },
        },
      },
    };
  }, [iR]);

  const seriesToggle: SeriesToggle[] = [
    { key: "raw", label: "Impedance (mΩ)", color: COLORS.roll, active: toggles.raw },
    { key: "roll", label: "Rolling median", color: COLORS.roll, active: toggles.roll },
    { key: "reg", label: "Regression", color: COLORS.reg, active: toggles.reg },
    { key: "vscat", label: "Voltage @ peaks", color: "oklch(0.488 0.243 264.376)", active: toggles.vscat },
  ];

  const handleToggle = useCallback((key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  }, []);

  const f1 = (v: number) => (Number.isNaN(v) ? "—" : v.toFixed(1));
  const f0 = (v: number) => (Number.isNaN(v) ? "—" : Math.round(v).toString());

  if (samples.length < 3) {
    return (
      <section className="scroll-mt-14 px-7 py-10" id="s-impedance">
        <div className="mx-auto max-w-[1300px]">
          <div className="mb-6 flex items-center gap-3">
            <span className="rounded border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-primary">
              04
            </span>
            <h2 className="text-xl font-medium">Impedance</h2>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            Not enough high-current samples for impedance analysis.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="scroll-mt-14 px-7 py-10" id="s-impedance">
      <div className="mx-auto max-w-[1300px]">
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-primary">
            04
          </span>
          <h2 className="text-xl font-medium">Impedance</h2>
        </div>

        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
          Internal resistance{" "}
          <span className="inline-flex items-baseline gap-0.5 rounded border border-border bg-card px-2 py-0.5 font-mono text-xs text-foreground">
            <i>R</i> = (<i>V</i><sub>oc</sub> − <i>V</i>) / <i>I</i>
          </span>
          , computed at every current peak (<i>I</i> &gt; 15A). The{" "}
          <strong className="text-foreground">
            voltage-at-peak scatter
          </strong>{" "}
          overlays terminal voltage at each impedance sample.
        </p>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            label="Median R"
            value={f1(stats.medianR)}
            unit="mΩ"
            note="Representative resistance"
            color={stats.medianR <= 18 ? "green" : stats.medianR <= 28 ? "yellow" : "red"}
          />
          <StatCard
            label="P90 R"
            value={f1(stats.p90R)}
            unit="mΩ"
            note="Under heavy current"
            color={stats.p90R <= 25 ? "green" : stats.p90R <= 40 ? "yellow" : "red"}
          />
          <StatCard
            label="Spike factor"
            value={f1(stats.spikeFactor)}
            unit="×"
            note="P90/Median"
            color={
              stats.spikeFactor <= 2
                ? "green"
                : stats.spikeFactor <= 3.5
                  ? "yellow"
                  : "red"
            }
          />
          <StatCard
            label="Est. CCA"
            value={f0(stats.estimatedCCA)}
            unit="A"
            note="7200/R_median empirical"
            color={
              stats.estimatedCCA >= 400
                ? "green"
                : stats.estimatedCCA >= 260
                  ? "yellow"
                  : "red"
            }
          />
          <StatCard
            label="R samples"
            value={String(stats.sampleCount)}
            unit=""
            note="I>15A peak samples used"
            color="blue"
          />
        </div>

        <ChartCard
          title="Impedance over time"
          subtitle="R = (Voc − V) / I at current peaks. Dashed: 28mΩ replacement threshold. Right axis = voltage at each peak."
          data={chartData}
          options={chartOptions}
          thresholds={[
            {
              y: 28,
              scaleId: "yR",
              color: "oklch(0.769 0.188 70.08 / 0.5)",
              label: "28mΩ replace",
            },
          ]}
          toggles={seriesToggle}
          onToggle={handleToggle}
          windowValue={window}
          windowLabel={windowLabel(window, dt)}
          onWindowChange={setWindow}
          equation={`Regression: ${formatEquation(reg, "t", "R(mΩ)")}`}
          onDownload={() =>
            downloadImpedanceCSV(samples, rollI, reg)
          }
          height={340}
        />
      </div>
    </section>
  );
}
