import { Badge } from "@repo/ui/components/badge";
import { useCallback, useEffect, useState } from "react";
import { getAllBatteries, getSessionsForBattery } from "@/services/tracker/db";
import type { Battery, BatterySession } from "@/services/tracker/types";
import { JuiceNav } from "../JuiceNav";

interface BatteryDetailViewProps {
  batteryId: string;
}

export function BatteryDetailView({ batteryId }: BatteryDetailViewProps) {
  const [battery, setBattery] = useState<Battery | null>(null);
  const [sessions, setSessions] = useState<BatterySession[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [batteries, sess] = await Promise.all([
      getAllBatteries(),
      getSessionsForBattery(batteryId),
    ]);
    setBattery(batteries.find((b) => b.id === batteryId) ?? null);
    setSessions(sess);
    setLoaded(true);
  }, [batteryId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="font-mono text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!battery) {
    return (
      <div className="min-h-screen">
        <JuiceNav active="tracker" />
        <div className="mx-auto max-w-5xl px-4 py-12 text-center">
          <p className="font-mono text-sm text-muted-foreground">Battery not found.</p>
          <a
            href="/polar-edge/juice/tracker"
            className="mt-4 inline-block font-mono text-xs text-primary underline"
          >
            Back to Tracker
          </a>
        </div>
      </div>
    );
  }

  const dslogSessions = sessions.filter((s) => s.dslogStats != null);
  const hasTrends = dslogSessions.length >= 2;

  // Health summary from dslog sessions
  const avgMedianR =
    dslogSessions.length > 0
      ? dslogSessions.reduce((sum, s) => sum + (s.dslogStats?.impedance.medianR ?? 0), 0) /
        dslogSessions.length
      : null;
  const worstMinV =
    dslogSessions.length > 0
      ? Math.min(...dslogSessions.map((s) => s.dslogStats?.voltage.min ?? Infinity))
      : null;
  const totalWh = dslogSessions.reduce((sum, s) => sum + (s.dslogStats?.power.totalWh ?? 0), 0);
  const brownoutRate =
    sessions.length > 0
      ? sessions.filter((s) => s.hadBrownout === true).length / sessions.length
      : 0;

  return (
    <div className="min-h-screen">
      <JuiceNav active="tracker" />

      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <a
            href="/polar-edge/juice/tracker"
            className="mb-2 inline-block font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            &larr; Back to Tracker
          </a>
          <h1 className="text-2xl font-bold">{battery.name}</h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} &middot;{" "}
            {dslogSessions.length} with DSLog data
          </p>
        </div>

        {/* Health Summary */}
        {dslogSessions.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Avg Impedance"
              value={avgMedianR !== null ? `${avgMedianR.toFixed(1)} mOhm` : "--"}
              color={impedanceColor(avgMedianR)}
            />
            <StatCard
              label="Worst Min V"
              value={
                worstMinV !== null && worstMinV !== Infinity ? `${worstMinV.toFixed(1)}V` : "--"
              }
              color={voltageColor(worstMinV)}
            />
            <StatCard label="Total Energy" value={`${totalWh.toFixed(1)} Wh`} />
            <StatCard
              label="Brownout Rate"
              value={`${(brownoutRate * 100).toFixed(0)}%`}
              color={brownoutRate > 0 ? "text-red-500" : "text-emerald-500"}
            />
          </div>
        )}

        {/* Trend Charts */}
        {hasTrends && (
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <TrendChart
              title="Median Impedance (mOhm)"
              sessions={dslogSessions}
              getValue={(s) => s.dslogStats?.impedance.medianR ?? 0}
              color="#f59e0b"
              higherIsBad
            />
            <TrendChart
              title="Min Voltage (V)"
              sessions={dslogSessions}
              getValue={(s) => s.dslogStats?.voltage.min ?? 0}
              color="#3b82f6"
              thresholds={[
                { value: 8.5, color: "#f59e0b", label: "8.5V" },
                { value: 6.3, color: "#ef4444", label: "6.3V" },
              ]}
            />
            <TrendChart
              title="Energy Used (Wh)"
              sessions={dslogSessions}
              getValue={(s) => s.dslogStats?.power.totalWh ?? 0}
              color="#8b5cf6"
            />
            <TrendChart
              title="Brownout Events"
              sessions={dslogSessions}
              getValue={(s) => s.dslogStats?.brownoutCount ?? 0}
              color="#ef4444"
              higherIsBad
              integer
            />
          </div>
        )}

        {/* Session History Table */}
        <div className="rounded-lg border border-border">
          <div className="border-b border-border px-4 py-2.5">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Session History
            </h3>
          </div>
          {sessions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-mono text-xs text-muted-foreground">No completed sessions yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">KW700</th>
                    <th className="px-4 py-2">Perf</th>
                    <th className="px-4 py-2">Brownout</th>
                    <th className="px-4 py-2">Min V</th>
                    <th className="px-4 py-2">Wh</th>
                    <th className="px-4 py-2">R (mOhm)</th>
                    <th className="px-4 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sessions.map((s) => (
                    <tr key={s.id}>
                      <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">
                        {new Date(s.checkedOutAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {s.kw700MOhms !== null ? `${s.kw700MOhms}` : "--"}
                      </td>
                      <td className="px-4 py-2">
                        {s.performance && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${perfBadgeColor(s.performance)}`}
                          >
                            {s.performance}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {s.hadBrownout === true && (
                          <Badge
                            variant="outline"
                            className="border-red-500/30 text-red-500 text-[10px]"
                          >
                            Yes
                          </Badge>
                        )}
                        {s.hadBrownout === false && (
                          <span className="font-mono text-xs text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {s.dslogStats ? s.dslogStats.voltage.min.toFixed(1) : "--"}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {s.dslogStats ? s.dslogStats.power.totalWh.toFixed(1) : "--"}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {s.dslogStats && s.dslogStats.impedance.sampleCount > 0
                          ? s.dslogStats.impedance.medianR.toFixed(1)
                          : "--"}
                      </td>
                      <td className="max-w-48 truncate px-4 py-2 font-mono text-xs text-muted-foreground">
                        {s.notes || "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color = "text-foreground",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className={`font-mono text-xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function impedanceColor(r: number | null): string {
  if (r === null) return "text-muted-foreground";
  if (r < 20) return "text-emerald-500";
  if (r < 40) return "text-amber-500";
  return "text-red-500";
}

function voltageColor(v: number | null): string {
  if (v === null || v === Infinity) return "text-muted-foreground";
  if (v >= 8.5) return "text-emerald-500";
  if (v >= 6.3) return "text-amber-500";
  return "text-red-500";
}

function perfBadgeColor(p: string): string {
  if (p === "excellent" || p === "good") return "border-emerald-500/30 text-emerald-500";
  if (p === "ok") return "border-amber-500/30 text-amber-500";
  return "border-red-500/30 text-red-500";
}

// ── Trend Chart ─────────────────────────────────────────────────────────────

interface TrendChartProps {
  title: string;
  sessions: BatterySession[];
  getValue: (s: BatterySession) => number;
  color: string;
  higherIsBad?: boolean;
  integer?: boolean;
  thresholds?: { value: number; color: string; label: string }[];
}

const CHART_H = 120;
const CHART_PAD = { top: 8, right: 12, bottom: 24, left: 48 };

function TrendChart({
  title,
  sessions,
  getValue,
  color,
  higherIsBad,
  integer,
  thresholds,
}: TrendChartProps) {
  const values = sessions.map(getValue);
  if (values.length < 2) return null;

  const width = 400;
  const cL = CHART_PAD.left;
  const cR = width - CHART_PAD.right;
  const cT = CHART_PAD.top;
  const cB = CHART_H - CHART_PAD.bottom;
  const cW = cR - cL;
  const cH = cB - cT;

  const allValues = [...values, ...(thresholds?.map((t) => t.value) ?? [])];
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const padding = (dataMax - dataMin) * 0.1 || 1;
  const yMin = dataMin - padding;
  const yMax = dataMax + padding;
  const range = yMax - yMin;

  const toX = (i: number) => cL + (i / (values.length - 1)) * cW;
  const toY = (v: number) => cT + cH - ((v - yMin) / range) * cH;

  const points = values.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");

  // Determine trend direction
  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  const trendUp = last > first;
  const trendColor = higherIsBad
    ? trendUp
      ? "text-red-500"
      : "text-emerald-500"
    : trendUp
      ? "text-emerald-500"
      : "text-red-500";
  const trendDelta = last - first;
  const trendSign = trendDelta >= 0 ? "+" : "";
  const trendLabel = integer ? `${trendSign}${trendDelta}` : `${trendSign}${trendDelta.toFixed(1)}`;

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-1 flex items-center justify-between">
        <h4 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {title}
        </h4>
        <span className={`font-mono text-xs font-semibold ${trendColor}`}>{trendLabel}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${CHART_H}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ height: CHART_H }}
      >
        <title>{title}</title>
        {/* Threshold lines */}
        {thresholds?.map((t) => (
          <g key={t.label}>
            <line
              x1={cL}
              x2={cR}
              y1={toY(t.value)}
              y2={toY(t.value)}
              stroke={t.color}
              strokeWidth={1}
              strokeDasharray="4 3"
              opacity={0.5}
            />
            <text x={cL + 3} y={toY(t.value) - 3} fill={t.color} fontSize={8} opacity={0.7}>
              {t.label}
            </text>
          </g>
        ))}

        {/* Data line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {values.map((v, i) => (
          <circle key={i} cx={toX(i)} cy={toY(v)} r={3} fill={color} />
        ))}

        {/* Y axis labels */}
        {[yMin, (yMin + yMax) / 2, yMax].map((tick) => (
          <text
            key={tick}
            x={cL - 4}
            y={toY(tick) + 3}
            textAnchor="end"
            fill="currentColor"
            opacity={0.4}
            fontSize={9}
          >
            {integer ? Math.round(tick) : tick.toFixed(1)}
          </text>
        ))}

        {/* X axis: session numbers */}
        {values.map((_, i) => (
          <text
            key={i}
            x={toX(i)}
            y={cB + 14}
            textAnchor="middle"
            fill="currentColor"
            opacity={0.35}
            fontSize={8}
          >
            {i + 1}
          </text>
        ))}
      </svg>
    </div>
  );
}
