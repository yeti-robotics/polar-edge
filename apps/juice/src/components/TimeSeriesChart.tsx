interface TimeSeriesChartProps {
  data: number[];
  /** Total duration in seconds for the X axis */
  durationSeconds?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  min?: number;
  max?: number;
  thresholds?: { value: number; color: string; label: string }[];
  segments?: { color: string }[];
}

const PADDING = { top: 8, right: 12, bottom: 28, left: 48 };

function niceTickValues(min: number, max: number, approxCount: number): number[] {
  const range = max - min || 1;
  const rough = range / approxCount;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;

  let step: number;
  if (residual <= 1.5) step = magnitude;
  else if (residual <= 3.5) step = 2 * magnitude;
  else if (residual <= 7.5) step = 5 * magnitude;
  else step = 10 * magnitude;

  const ticks: number[] = [];
  let tick = Math.ceil(min / step) * step;
  while (tick <= max) {
    ticks.push(tick);
    tick += step;
  }
  return ticks;
}

function formatTickLabel(value: number): string {
  if (Number.isInteger(value)) return String(value);
  if (Math.abs(value) >= 100) return value.toFixed(0);
  if (Math.abs(value) >= 1) return value.toFixed(1);
  return value.toFixed(2);
}

function formatTimeLabel(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `${m}m${s}s` : `${m}m`;
}

export function TimeSeriesChart({
  data,
  durationSeconds,
  height = 140,
  color = "currentColor",
  fillColor,
  min: forceMin,
  max: forceMax,
  thresholds,
  segments,
}: TimeSeriesChartProps) {
  if (data.length === 0) return null;

  const width = 600;
  const chartLeft = PADDING.left;
  const chartRight = width - PADDING.right;
  const chartTop = PADDING.top;
  const chartBottom = height - PADDING.bottom;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const dataMin = forceMin ?? Math.min(...data);
  const dataMax = forceMax ?? Math.max(...data);
  const range = dataMax - dataMin || 1;

  const totalSeconds = durationSeconds ?? (data.length * 0.02);

  const toY = (v: number) =>
    chartTop + chartHeight - ((v - dataMin) / range) * chartHeight;
  const toX = (i: number) =>
    chartLeft + (i / (data.length - 1)) * chartWidth;

  // Downsample for perf if > 2000 points
  const step = data.length > 2000 ? Math.ceil(data.length / 2000) : 1;

  const points: string[] = [];
  for (let i = 0; i < data.length; i += step) {
    points.push(`${toX(i).toFixed(1)},${toY(data[i]!).toFixed(1)}`);
  }
  const polyline = points.join(" ");

  const fillPoints = fillColor
    ? `${chartLeft},${toY(dataMin).toFixed(1)} ${polyline} ${chartRight},${toY(dataMin).toFixed(1)}`
    : undefined;

  // Y axis ticks
  const yTicks = niceTickValues(dataMin, dataMax, 4);

  // X axis ticks
  const xTickCount = 6;
  const xTicks: { index: number; seconds: number }[] = [];
  for (let t = 0; t <= xTickCount; t++) {
    const frac = t / xTickCount;
    xTicks.push({
      index: Math.round(frac * (data.length - 1)),
      seconds: frac * totalSeconds,
    });
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
      style={{ height }}
    >
      {/* Grid lines */}
      {yTicks.map((tick) => (
        <line
          key={`grid-y-${tick}`}
          x1={chartLeft}
          x2={chartRight}
          y1={toY(tick)}
          y2={toY(tick)}
          stroke="currentColor"
          opacity={0.07}
          strokeWidth={1}
        />
      ))}

      {/* Phase segment background bands */}
      {segments && (
        <>
          {(() => {
            const bands: { startIdx: number; endIdx: number; color: string }[] = [];
            let currentColor = segments[0]?.color ?? "transparent";
            let bandStart = 0;
            for (let i = 1; i < segments.length; i += step) {
              const segColor = segments[i]?.color ?? "transparent";
              if (segColor !== currentColor) {
                bands.push({ startIdx: bandStart, endIdx: i, color: currentColor });
                currentColor = segColor;
                bandStart = i;
              }
            }
            bands.push({ startIdx: bandStart, endIdx: segments.length - 1, color: currentColor });
            return bands
              .filter((b) => b.color !== "transparent")
              .map((b) => (
                <rect
                  key={b.startIdx}
                  x={toX(b.startIdx)}
                  y={chartTop}
                  width={toX(b.endIdx) - toX(b.startIdx)}
                  height={chartHeight}
                  fill={b.color}
                  opacity={0.1}
                />
              ));
          })()}
        </>
      )}

      {/* Threshold lines */}
      {thresholds?.map((t) => (
        <g key={t.label}>
          <line
            x1={chartLeft}
            x2={chartRight}
            y1={toY(t.value)}
            y2={toY(t.value)}
            stroke={t.color}
            strokeWidth={1}
            strokeDasharray="6 3"
            opacity={0.5}
          />
          <text
            x={chartLeft + 4}
            y={toY(t.value) - 3}
            fill={t.color}
            fontSize={9}
            opacity={0.7}
          >
            {t.label}
          </text>
        </g>
      ))}

      {/* Fill area */}
      {fillPoints && (
        <polygon points={fillPoints} fill={fillColor} opacity={0.15} />
      )}

      {/* Data line */}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />

      {/* Y axis */}
      <line
        x1={chartLeft}
        x2={chartLeft}
        y1={chartTop}
        y2={chartBottom}
        stroke="currentColor"
        opacity={0.15}
        strokeWidth={1}
      />
      {yTicks.map((tick) => (
        <text
          key={`label-y-${tick}`}
          x={chartLeft - 6}
          y={toY(tick) + 3}
          textAnchor="end"
          fill="currentColor"
          opacity={0.5}
          fontSize={10}
        >
          {formatTickLabel(tick)}
        </text>
      ))}

      {/* X axis */}
      <line
        x1={chartLeft}
        x2={chartRight}
        y1={chartBottom}
        y2={chartBottom}
        stroke="currentColor"
        opacity={0.15}
        strokeWidth={1}
      />
      {xTicks.map((tick) => (
        <text
          key={`label-x-${tick.index}`}
          x={toX(tick.index)}
          y={chartBottom + 16}
          textAnchor="middle"
          fill="currentColor"
          opacity={0.5}
          fontSize={10}
        >
          {formatTimeLabel(tick.seconds)}
        </text>
      ))}
    </svg>
  );
}
