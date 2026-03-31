import { useEffect, useState } from "react";
import { LogStoreService } from "@/services/LogStore";
import type { StoredLog, StoredRecord } from "@/services/LogStore";
import type { DSLogParsedRecord } from "@/services/dslog";
import { TimeSeriesChart } from "./TimeSeriesChart";

type DSLogStoredRecord = StoredRecord<DSLogParsedRecord>;

interface LogAnalysisProps {
  log: StoredLog;
  onBack: () => void;
}

interface AnalysisSummary {
  durationSeconds: number;
  avgVoltage: number;
  minVoltage: number;
  avgTripTime: number;
  maxTripTime: number;
  avgPacketLoss: number;
  maxPacketLoss: number;
  avgCanUtil: number;
  avgCpu: number;
  brownoutCount: number;
  brownoutSeconds: number;
  autoSeconds: number;
  teleopSeconds: number;
  disabledSeconds: number;
  totalCurrentDraw: number;
}

function computeSummary(records: DSLogStoredRecord[]): AnalysisSummary {
  const n = records.length;
  const dt = 0.02; // 20ms per record

  let sumVoltage = 0;
  let enabledVoltageCount = 0;
  let minVoltage = Number.POSITIVE_INFINITY;
  let sumTrip = 0;
  let maxTrip = 0;
  let sumLoss = 0;
  let maxLoss = 0;
  let sumCan = 0;
  let sumCpu = 0;
  let brownoutCount = 0;
  let brownoutRecords = 0;
  let autoRecords = 0;
  let teleopRecords = 0;
  let disabledRecords = 0;
  let wasBrownout = false;
  let sumCurrent = 0;

  for (const r of records) {
    const d = r.data;

    if (d.voltageV > 0 && d.voltageV <= 20) {
      sumVoltage += d.voltageV;
      enabledVoltageCount++;
      if (d.voltageV < minVoltage) minVoltage = d.voltageV;
    }

    sumTrip += d.tripTimeMs;
    if (d.tripTimeMs > maxTrip) maxTrip = d.tripTimeMs;
    sumLoss += d.packetLossPercent;
    if (d.packetLossPercent > maxLoss) maxLoss = d.packetLossPercent;
    sumCan += d.canUtilizationPercent;
    sumCpu += d.rioCpuPercent;

    if (d.brownout && !d.robotDisabled) {
      brownoutRecords++;
      if (!wasBrownout) brownoutCount++;
      wasBrownout = true;
    } else {
      wasBrownout = false;
    }

    if (!d.robotDisabled) {
      if (d.robotAuto) autoRecords++;
      else if (d.robotTeleop) teleopRecords++;
    }
    if (d.robotDisabled) disabledRecords++;

    for (const ch of d.pdpChannels) {
      sumCurrent += ch;
    }
  }

  return {
    durationSeconds: n * dt,
    avgVoltage: enabledVoltageCount > 0 ? sumVoltage / enabledVoltageCount : 0,
    minVoltage: minVoltage === Number.POSITIVE_INFINITY ? 0 : minVoltage,
    avgTripTime: sumTrip / n,
    maxTripTime: maxTrip,
    avgPacketLoss: sumLoss / n,
    maxPacketLoss: maxLoss,
    avgCanUtil: sumCan / n,
    avgCpu: sumCpu / n,
    brownoutCount,
    brownoutSeconds: brownoutRecords * dt,
    autoSeconds: autoRecords * dt,
    teleopSeconds: teleopRecords * dt,
    disabledSeconds: disabledRecords * dt,
    totalCurrentDraw: sumCurrent * dt,
  };
}

function StatCard({
  label,
  value,
  sub,
  warn,
}: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${warn ? "border-destructive/30 bg-destructive/5" : ""}`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${warn ? "text-destructive" : ""}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function PhaseBar({ summary }: { summary: AnalysisSummary }) {
  const total = summary.durationSeconds || 1;
  const autoPct = (summary.autoSeconds / total) * 100;
  const teleopPct = (summary.teleopSeconds / total) * 100;
  const disabledPct = 100 - autoPct - teleopPct;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-4 w-full overflow-hidden rounded-full">
        {autoPct > 0 && (
          <div
            className="bg-blue-500"
            style={{ width: `${autoPct}%` }}
            title={`Auto: ${summary.autoSeconds.toFixed(1)}s`}
          />
        )}
        {teleopPct > 0 && (
          <div
            className="bg-green-500"
            style={{ width: `${teleopPct}%` }}
            title={`Teleop: ${summary.teleopSeconds.toFixed(1)}s`}
          />
        )}
        {disabledPct > 0 && (
          <div
            className="bg-muted"
            style={{ width: `${disabledPct}%` }}
            title={`Disabled: ${(total - summary.autoSeconds - summary.teleopSeconds).toFixed(1)}s`}
          />
        )}
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
          Auto {summary.autoSeconds.toFixed(1)}s
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          Teleop {summary.teleopSeconds.toFixed(1)}s
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/40" />
          Disabled
        </span>
      </div>
    </div>
  );
}

function ChartSection({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      <div className="rounded-lg border p-2">{children}</div>
    </div>
  );
}

function PdpHeatmap({ records }: { records: DSLogStoredRecord[] }) {
  if (records.length === 0 || records[0]!.data.pdpChannels.length === 0)
    return <p className="text-xs text-muted-foreground">No PDP data</p>;

  const channelCount = records[0]!.data.pdpChannels.length;
  const avgCurrents: number[] = [];
  const maxCurrents: number[] = [];

  for (let ch = 0; ch < channelCount; ch++) {
    let sum = 0;
    let max = 0;
    for (const r of records) {
      const v = r.data.pdpChannels[ch] ?? 0;
      sum += v;
      if (v > max) max = v;
    }
    avgCurrents.push(sum / records.length);
    maxCurrents.push(max);
  }

  const globalMax = Math.max(...maxCurrents, 1);

  return (
    <div className="grid grid-cols-4 gap-1">
      {avgCurrents.map((avg, i) => {
        const intensity = maxCurrents[i]! / globalMax;
        return (
          <div
            key={i}
            className="flex flex-col items-center rounded border px-2 py-1"
            style={{
              backgroundColor: `rgba(239, 68, 68, ${intensity * 0.25})`,
            }}
          >
            <span className="text-[10px] text-muted-foreground">CH {i}</span>
            <span className="text-xs font-medium">{avg.toFixed(1)}A</span>
            <span className="text-[10px] text-muted-foreground">
              peak {maxCurrents[i]!.toFixed(1)}A
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function LogAnalysis({ log, onBack }: LogAnalysisProps) {
  const [records, setRecords] = useState<DSLogStoredRecord[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const store = await LogStoreService.getInstance();
      const data = await store.getRecordsForLog<DSLogParsedRecord>(
        log.id,
        log.logType
      );
      if (!cancelled) {
        setRecords(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [log.id, log.logType]);

  if (loading || !records) {
    return <p className="text-sm text-muted-foreground">Loading records...</p>;
  }

  const summary = computeSummary(records);

  const voltages = records.map((r) => r.data.voltageV);
  const tripTimes = records.map((r) => r.data.tripTimeMs);
  const packetLoss = records.map((r) => r.data.packetLossPercent);
  const canUtil = records.map((r) => r.data.canUtilizationPercent * 100);
  const cpu = records.map((r) => r.data.rioCpuPercent * 100);
  const totalCurrent = records.map((r) =>
    r.data.pdpChannels.reduce((a, b) => a + b, 0)
  );

  const phaseSegments = records.map((r) => ({
    color: r.data.robotAuto
      ? "rgb(59,130,246)"
      : r.data.robotTeleop
        ? "rgb(34,197,94)"
        : "transparent",
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back
        </button>
        <div>
          <h2 className="font-semibold">{log.fileName}</h2>
          <p className="text-xs text-muted-foreground">
            {new Date(log.startTime).toLocaleString()}
            {" · "}
            {summary.durationSeconds.toFixed(1)}s
            {" · "}
            {log.recordCount.toLocaleString()} samples
          </p>
        </div>
      </div>

      <PhaseBar summary={summary} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          label="Avg Voltage"
          value={`${summary.avgVoltage.toFixed(2)}V`}
          sub={`Min: ${summary.minVoltage.toFixed(2)}V`}
          warn={summary.minVoltage < 7}
        />
        <StatCard
          label="Brownouts"
          value={String(summary.brownoutCount)}
          sub={`${summary.brownoutSeconds.toFixed(1)}s total`}
          warn={summary.brownoutCount > 0}
        />
        <StatCard
          label="Avg Trip Time"
          value={`${summary.avgTripTime.toFixed(1)}ms`}
          sub={`Max: ${summary.maxTripTime.toFixed(1)}ms`}
          warn={summary.avgTripTime > 10}
        />
        <StatCard
          label="Avg Packet Loss"
          value={`${summary.avgPacketLoss.toFixed(1)}%`}
          sub={`Max: ${summary.maxPacketLoss.toFixed(1)}%`}
          warn={summary.avgPacketLoss > 5}
        />
        <StatCard
          label="CAN Utilization"
          value={`${(summary.avgCanUtil * 100).toFixed(1)}%`}
          warn={summary.avgCanUtil > 0.7}
        />
        <StatCard
          label="roboRIO CPU"
          value={`${(summary.avgCpu * 100).toFixed(1)}%`}
          warn={summary.avgCpu > 0.8}
        />
        <StatCard
          label="Auto Time"
          value={`${summary.autoSeconds.toFixed(1)}s`}
        />
        <StatCard
          label="Teleop Time"
          value={`${summary.teleopSeconds.toFixed(1)}s`}
        />
      </div>

      <ChartSection title="Battery Voltage (V)">
        <TimeSeriesChart
          data={voltages}
          durationSeconds={summary.durationSeconds}
          color="hsl(142, 71%, 45%)"
          fillColor="hsl(142, 71%, 45%)"
          min={0}
          max={14}
          segments={phaseSegments}
          thresholds={[
            { value: 12, color: "hsl(48, 96%, 53%)", label: "12V" },
            { value: 7, color: "hsl(0, 84%, 60%)", label: "7V brownout" },
          ]}
        />
      </ChartSection>

      <ChartSection title="Trip Time (ms)">
        <TimeSeriesChart
          data={tripTimes}
          durationSeconds={summary.durationSeconds}
          color="hsl(221, 83%, 53%)"
          fillColor="hsl(221, 83%, 53%)"
          min={0}
          segments={phaseSegments}
          thresholds={[
            { value: 10, color: "hsl(48, 96%, 53%)", label: "10ms" },
          ]}
        />
      </ChartSection>

      <ChartSection title="Packet Loss (%)">
        <TimeSeriesChart
          data={packetLoss}
          durationSeconds={summary.durationSeconds}
          color="hsl(0, 84%, 60%)"
          fillColor="hsl(0, 84%, 60%)"
          min={0}
          max={100}
          segments={phaseSegments}
        />
      </ChartSection>

      <ChartSection title="CAN Utilization (%)">
        <TimeSeriesChart
          data={canUtil}
          durationSeconds={summary.durationSeconds}
          color="hsl(280, 67%, 55%)"
          fillColor="hsl(280, 67%, 55%)"
          min={0}
          max={100}
          segments={phaseSegments}
          thresholds={[
            { value: 70, color: "hsl(48, 96%, 53%)", label: "70%" },
          ]}
        />
      </ChartSection>

      <ChartSection title="roboRIO CPU (%)">
        <TimeSeriesChart
          data={cpu}
          durationSeconds={summary.durationSeconds}
          color="hsl(25, 95%, 53%)"
          fillColor="hsl(25, 95%, 53%)"
          min={0}
          max={100}
          segments={phaseSegments}
        />
      </ChartSection>

      <ChartSection title="Total Current Draw (A)">
        <TimeSeriesChart
          data={totalCurrent}
          durationSeconds={summary.durationSeconds}
          color="hsl(348, 83%, 47%)"
          fillColor="hsl(348, 83%, 47%)"
          min={0}
          segments={phaseSegments}
        />
      </ChartSection>

      <ChartSection title="PDP Channels — Avg / Peak Current">
        <PdpHeatmap records={records} />
      </ChartSection>
    </div>
  );
}
