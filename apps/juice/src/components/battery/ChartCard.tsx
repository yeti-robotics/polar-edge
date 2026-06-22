import { Button } from "@repo/ui/components/button";
import {
  BarController,
  BarElement,
  CategoryScale,
  type ChartData,
  Chart as ChartJS,
  type ChartOptions,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  type Plugin,
  PointElement,
  ScatterController,
  Tooltip,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { useMemo, useRef } from "react";
import { Chart } from "react-chartjs-2";

// Register only what we need
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  ScatterController,
  Tooltip,
  Filler,
  zoomPlugin
);

export interface ThresholdLine {
  y: number;
  color: string;
  label: string;
  scaleId?: string;
}

export interface SeriesToggle {
  key: string;
  label: string;
  color: string;
  active: boolean;
}

interface ChartCardProps {
  title: string;
  subtitle: string;
  data: ChartData<"line" | "bar" | "scatter">;
  options: ChartOptions;
  thresholds?: ThresholdLine[];
  toggles?: SeriesToggle[];
  onToggle?: (key: string) => void;
  windowValue?: number;
  windowLabel?: string;
  onWindowChange?: (value: number) => void;
  equation?: string;
  onDownload?: () => void;
  height?: number;
}

function createThresholdPlugin(lines: ThresholdLine[]): Plugin {
  return {
    id: "thresholdLines",
    afterDraw(chart) {
      for (const { y, scaleId = "y", color, label } of lines) {
        const scale = chart.scales[scaleId];
        if (!scale) continue;
        const { ctx, chartArea: ca } = chart;
        const py = scale.getPixelForValue(y);
        if (py < ca.top || py > ca.bottom) continue;

        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(ca.left, py);
        ctx.lineTo(ca.right, py);
        ctx.stroke();
        ctx.font = "9px ui-monospace, monospace";
        ctx.fillStyle = color;
        ctx.textAlign = "right";
        ctx.fillText(label, ca.right - 4, py - 3);
        ctx.restore();
      }
    },
  };
}

export function ChartCard({
  title,
  subtitle,
  data,
  options,
  thresholds,
  toggles,
  onToggle,
  windowValue,
  windowLabel,
  onWindowChange,
  equation,
  onDownload,
  height = 320,
}: ChartCardProps) {
  const chartRef = useRef<ChartJS>(null);

  const plugins = useMemo<Plugin[]>(() => {
    const p: Plugin[] = [];
    if (thresholds?.length) p.push(createThresholdPlugin(thresholds));
    return p;
  }, [thresholds]);

  // Apply toggle visibility to data
  const visibleData = useMemo(() => {
    if (!toggles) return data;
    return {
      ...data,
      datasets: data.datasets.map((ds, i) => ({
        ...ds,
        hidden: toggles[i] ? !toggles[i].active : false,
      })),
    };
  }, [data, toggles]);

  return (
    <div className="flex flex-col gap-3">
      {/* Controls bar */}
      {(toggles || onWindowChange || equation) && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card/50 p-3">
          {toggles && onToggle && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Show
              </span>
              {toggles.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => onToggle(t.key)}
                  className="rounded px-2.5 py-1 font-mono text-[10px] transition-colors border"
                  style={{
                    backgroundColor: t.active ? t.color : "transparent",
                    color: t.active ? "var(--background)" : "var(--muted-foreground)",
                    borderColor: t.active ? t.color : "var(--border)",
                    fontWeight: t.active ? 500 : 400,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {onWindowChange && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Window
              </span>
              <input
                type="range"
                min={1}
                max={250}
                value={windowValue}
                onChange={(e) => onWindowChange(Number(e.target.value))}
                className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              />
              <span className="min-w-[36px] font-mono text-[11px] text-primary">{windowLabel}</span>
            </div>
          )}

          {equation && (
            <span className="rounded border border-amber-500/20 bg-amber-500/10 px-3 py-1 font-mono text-xs text-amber-500">
              {equation}
            </span>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              {title}
            </h3>
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => (chartRef.current as ChartJS | null)?.resetZoom()}
            className="flex-shrink-0 rounded border border-border px-2 py-0.5 font-mono text-[9px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            title="Reset zoom"
          >
            Reset zoom
          </button>
        </div>
        <div style={{ height }}>
          <Chart
            ref={chartRef}
            type="line"
            data={visibleData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              animation: false,
              plugins: {
                legend: { display: false },
                zoom: {
                  limits: {
                    x: { min: "original", max: "original", minRange: 12 },
                  },
                  zoom: {
                    wheel: { enabled: true },
                    drag: { enabled: true, backgroundColor: "oklch(0.7366 0.1138 232.04 / 0.1)", borderColor: "oklch(0.7366 0.1138 232.04 / 0.4)", borderWidth: 1 },
                    mode: "x",
                  },
                  pan: {
                    enabled: true,
                    mode: "x",
                  },
                },
              },
              ...options,
            }}
            plugins={plugins}
          />
        </div>
        <p className="mt-2 font-mono text-[9px] text-muted-foreground/50">
          Scroll to zoom · Drag to select range · Shift+drag to pan · Reset zoom to fit all
        </p>
      </div>

      {onDownload && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          className="self-start text-muted-foreground"
        >
          ⬇ Download CSV
        </Button>
      )}
    </div>
  );
}
