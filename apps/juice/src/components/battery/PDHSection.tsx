import type { ChartData, ChartOptions } from "chart.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  exportPDHConfig,
  getChannelBreaker,
  importPDHConfig,
  loadPDHConfig,
  PDH_CHANNEL_COUNT,
  PDH_COLORS,
  savePDHConfig,
  type PDHConfig,
  type SubsystemConfig,
} from "@/services/pdh/config";
import type { MergedData } from "@/services/analysis/types";
import { detectPhases, type PhaseSegment } from "@/services/analysis/phases";
import { rollingMean } from "@/services/analysis/rolling";
import { ChartCard } from "./ChartCard";

interface PDHSectionProps {
  data: MergedData;
}

const TICK_STYLE = {
  color: "oklch(0.552 0.016 285.938)",
  font: { family: "ui-monospace, monospace", size: 10 as const },
};

export function PDHSection({ data }: PDHSectionProps) {
  const [config, setConfig] = useState<PDHConfig>(() => loadPDHConfig());

  useEffect(() => {
    const onStorage = () => setConfig(loadPDHConfig());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: PDHConfig) => {
    setConfig(next);
    savePDHConfig(next);
  }, []);

  // ── Subsystem management ──────────────────────────────────────

  const addSubsystem = useCallback(() => {
    setConfig((prev) => {
      const idx = prev.subsystems.length % PDH_COLORS.length;
      const next: PDHConfig = {
        ...prev,
        subsystems: [
          ...prev.subsystems,
          { name: `Subsystem ${prev.subsystems.length + 1}`, color: PDH_COLORS[idx] ?? "#3b82f6", weight: 0 },
        ],
      };
      savePDHConfig(next);
      return next;
    });
  }, []);

  const renameSubsystem = useCallback(
    (oldName: string, newName: string) => {
      persist({
        ...config,
        subsystems: config.subsystems.map((s) => (s.name === oldName ? { ...s, name: newName } : s)),
        channels: config.channels.map((ch) =>
          ch.subsystem === oldName ? { ...ch, subsystem: newName } : ch
        ),
      });
    },
    [config, persist]
  );

  const updateSubsystemColor = useCallback(
    (name: string, color: string) => {
      persist({
        ...config,
        subsystems: config.subsystems.map((s) => (s.name === name ? { ...s, color } : s)),
      });
    },
    [config, persist]
  );

  const deleteSubsystem = useCallback(
    (name: string) => {
      persist({
        ...config,
        subsystems: config.subsystems.filter((s) => s.name !== name),
        channels: config.channels.map((ch) =>
          ch.subsystem === name ? { ...ch, subsystem: "" } : ch
        ),
      });
    },
    [config, persist]
  );

  const setChannelLabel = useCallback(
    (ch: number, label: string) => {
      const channels = [...config.channels];
      channels[ch] = { ...channels[ch]!, label };
      persist({ ...config, channels });
    },
    [config, persist]
  );

  // ── Drag and drop ─────────────────────────────────────────────

  const [pdhWindow, setPdhWindow] = useState(5);
  const [showPhases, setShowPhases] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImport = useCallback(async (file: File) => {
    try {
      const imported = await importPDHConfig(file);
      persist(imported);
      setImportError(null);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Import failed.");
    }
  }, [persist]);

  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const dragCounters = useRef<Record<string, number>>({});

  const handleDragStart = useCallback((ch: number) => setDragging(ch), []);
  const handleDragEnd = useCallback(() => { setDragging(null); setDragOver(null); }, []);

  const handleDragEnter = useCallback((zone: string) => {
    dragCounters.current[zone] = (dragCounters.current[zone] ?? 0) + 1;
    setDragOver(zone);
  }, []);

  const handleDragLeave = useCallback((zone: string) => {
    dragCounters.current[zone] = (dragCounters.current[zone] ?? 1) - 1;
    if ((dragCounters.current[zone] ?? 0) <= 0) {
      dragCounters.current[zone] = 0;
      setDragOver((prev) => (prev === zone ? null : prev));
    }
  }, []);

  const handleDrop = useCallback(
    (zone: string) => {
      if (dragging === null) return;
      const channels = [...config.channels];
      channels[dragging] = { ...channels[dragging]!, subsystem: zone === "__unassigned" ? "" : zone };
      persist({ ...config, channels });
      dragCounters.current = {};
      setDragOver(null);
    },
    [dragging, config, persist]
  );

  // ── Chart data ────────────────────────────────────────────────

  const hasChannelData = useMemo(() => Object.keys(data.channels).length > 0, [data.channels]);

  const channelMeans = useMemo(() => {
    const out: Record<number, number> = {};
    for (let ch = 0; ch < PDH_CHANNEL_COUNT; ch++) {
      const arr = data.channels[`CH ${ch}`];
      if (!arr || arr.length === 0) { out[ch] = 0; continue; }
      const tail = arr.slice(-Math.min(50, arr.length));
      out[ch] = tail.reduce((s, v) => s + v, 0) / tail.length;
    }
    return out;
  }, [data.channels]);

  const channelPeaks = useMemo(() => {
    const out: Record<number, number> = {};
    for (let ch = 0; ch < PDH_CHANNEL_COUNT; ch++) {
      const arr = data.channels[`CH ${ch}`];
      out[ch] = arr && arr.length > 0 ? Math.max(...arr) : 0;
    }
    return out;
  }, [data.channels]);

  const safeCurr = useMemo(
    () => data.currents.map((c) => (Number.isNaN(c) ? 0 : Math.max(0, c))),
    [data.currents]
  );

  const subsystemStats = useMemo(() => {
    const stats: Record<string, { mean: number; peak: number }> = {};
    for (const sub of config.subsystems) {
      if (!hasChannelData) {
        if (sub.weight > 0) {
          const weighted = safeCurr.map((c) => c * (sub.weight / 100));
          const mean = weighted.reduce((s, v) => s + v, 0) / (weighted.length || 1);
          stats[sub.name] = { mean, peak: weighted.length > 0 ? Math.max(...weighted) : 0 };
        } else {
          stats[sub.name] = { mean: 0, peak: 0 };
        }
        continue;
      }
      const chIndices = config.channels
        .map((ch, idx) => (ch.subsystem === sub.name ? idx : -1))
        .filter((idx) => idx !== -1);
      if (chIndices.length === 0) { stats[sub.name] = { mean: 0, peak: 0 }; continue; }
      const totals = Array.from({ length: data.times.length }, (_, i) =>
        chIndices.reduce((sum, ch) => sum + (data.channels[`CH ${ch}`]?.[i] ?? 0), 0)
      );
      const mean = totals.reduce((s, v) => s + v, 0) / (totals.length || 1);
      stats[sub.name] = { mean, peak: totals.length > 0 ? Math.max(...totals) : 0 };
    }
    return stats;
  }, [config, data, hasChannelData, safeCurr]);

  const chartData = useMemo<ChartData<"line">>(() => {
    const step = Math.max(1, Math.floor(data.times.length / 600));
    const labels = data.times.filter((_, i) => i % step === 0).map((t) => +t.toFixed(2));
    const datasets: ChartData<"line">["datasets"] = [];

    if (config.subsystems.length === 0) {
      const smoothed = Array.from(rollingMean(new Float64Array(safeCurr), pdhWindow));
      datasets.push({
        label: "Total current",
        data: smoothed.filter((_, i) => i % step === 0).map((v) => +v.toFixed(2)),
        borderColor: "oklch(0.7366 0.1138 232.04)",
        fill: false,
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.1,
      });
      return { labels, datasets };
    }

    for (const sub of config.subsystems) {
      let subCurrents: number[];

      if (hasChannelData) {
        const chIndices = config.channels
          .map((ch, idx) => (ch.subsystem === sub.name ? idx : -1))
          .filter((idx) => idx !== -1);
        subCurrents = Array.from({ length: data.times.length }, (_, i) =>
          chIndices.reduce((sum, ch) => sum + (data.channels[`CH ${ch}`]?.[i] ?? 0), 0)
        );
      } else {
        if (sub.weight <= 0) continue;
        subCurrents = safeCurr.map((c) => c * (sub.weight / 100));
      }

      const smoothed = Array.from(rollingMean(new Float64Array(subCurrents), pdhWindow));
      datasets.push({
        label: sub.name,
        data: smoothed.filter((_, i) => i % step === 0).map((v) => +v.toFixed(2)),
        fill: false,
        borderColor: sub.color,
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.1,
      });
    }

    return { labels, datasets };
  }, [data, config, hasChannelData, safeCurr, pdhWindow]);

  const chartOptions = useMemo<ChartOptions>(
    () => ({
      scales: {
        x: { ticks: { ...TICK_STYLE, maxTicksLimit: 12 }, grid: { color: "oklch(1 0 0 / 0.04)" } },
        y: {
          min: 0,
          ticks: TICK_STYLE,
          grid: { color: "oklch(1 0 0 / 0.04)" },
          title: { display: true, text: "A", color: TICK_STYLE.color, font: { size: 10, family: "ui-monospace, monospace" } },
        },
      },
    }),
    []
  );

  const phases = useMemo(
    () => (showPhases ? detectPhases(data, config) : []),
    [data, config, showPhases]
  );

  const channelsByZone = (zoneName: string) =>
    Array.from({ length: PDH_CHANNEL_COUNT }, (_, i) => i).filter((ch) => {
      const sub = config.channels[ch]?.subsystem ?? "";
      return zoneName === "__unassigned" ? sub === "" : sub === zoneName;
    });

  return (
    <section className="scroll-mt-14 border-b border-border px-7 py-10" id="s-pdh">
      <div className="mx-auto max-w-[1300px]">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="rounded border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-primary">
            05
          </span>
          <h2 className="text-xl font-medium">PDH Channels</h2>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPhases((v) => !v)}
              className={`rounded border px-3 py-1 font-mono text-[10px] transition-colors ${
                showPhases
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary"
              }`}
            >
              {showPhases ? "◉ Phase detection on" : "○ Phase detection"}
            </button>
            <button
              type="button"
              onClick={() => exportPDHConfig(config)}
              className="rounded border border-border bg-card px-3 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              Export config
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="rounded border border-border bg-card px-3 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              Import config
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>
        {importError && (
          <p className="mb-4 rounded border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-[11px] text-destructive">
            {importError}
          </p>
        )}

        {/* Top row: subsystem list LEFT + chart RIGHT */}
        <div className="mb-6 flex gap-4">

          {/* Left: subsystem list */}
          <div className="flex w-52 flex-shrink-0 flex-col gap-2">
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              Subsystems
            </span>

            {config.subsystems.map((sub) => {
              const chNums = channelsByZone(sub.name);
              return (
                <SubsystemRow
                  key={sub.name}
                  sub={sub}
                  channels={chNums.map((ch) => ({ ch, label: config.channels[ch]?.label ?? "" }))}
                  stats={subsystemStats[sub.name]}
                  onRename={(newName) => renameSubsystem(sub.name, newName)}
                  onColorChange={(color) => updateSubsystemColor(sub.name, color)}
                  onDelete={() => deleteSubsystem(sub.name)}
                />
              );
            })}

            {config.subsystems.length === 0 && (
              <p className="text-[11px] text-muted-foreground">No subsystems yet.</p>
            )}

            <button
              type="button"
              onClick={addSubsystem}
              className="mt-1 rounded border border-dashed border-border py-1.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              + Add subsystem
            </button>
          </div>

          {/* Right: chart */}
          <div className="min-w-0 flex-1">
            <ChartCard
              title="Current draw by subsystem"
              subtitle={
                hasChannelData
                  ? "Measured per-channel current grouped by subsystem."
                  : config.subsystems.length > 0
                    ? "Estimated — total current scaled by subsystem weight %."
                    : "Assign channels to subsystems below to see a breakdown."
              }
              data={chartData}
              options={chartOptions}
              height={260}
              windowValue={pdhWindow}
              windowLabel={data.dt > 0 ? `${(pdhWindow * data.dt).toFixed(2)}s` : `${pdhWindow}×`}
              onWindowChange={setPdhWindow}
            />
            {showPhases && config.subsystems.length > 0 && (
              <div className="mt-4 rounded-lg border border-border bg-card p-4">
                <h4 className="mb-3 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  Phase detection
                </h4>
                {phases.length === 0 ? (
                  <p className="font-mono text-[11px] text-muted-foreground/60">
                    No active phases detected. Assign channels to subsystems and load a file with PDH current data.
                  </p>
                ) : (
                  <PhaseTimeline
                    phases={phases}
                    subsystems={config.subsystems}
                    startT={data.times[0] ?? 0}
                    endT={data.times[data.times.length - 1] ?? 0}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom: drag-and-drop channel zones */}
        <div className="space-y-3">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Channels — drag to assign
          </span>

          <DropZone
            name="__unassigned"
            label="Unassigned"
            color="#6b7280"
            channels={channelsByZone("__unassigned")}
            config={config}
            hasChannelData={hasChannelData}
            channelMeans={channelMeans}
            channelPeaks={channelPeaks}
            isDragOver={dragOver === "__unassigned"}
            onDragEnter={() => handleDragEnter("__unassigned")}
            onDragLeave={() => handleDragLeave("__unassigned")}
            onDrop={() => handleDrop("__unassigned")}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onLabelChange={setChannelLabel}
          />

          {config.subsystems.map((sub) => (
            <DropZone
              key={sub.name}
              name={sub.name}
              label={sub.name}
              color={sub.color}
              channels={channelsByZone(sub.name)}
              config={config}
              hasChannelData={hasChannelData}
              channelMeans={channelMeans}
              channelPeaks={channelPeaks}
              isDragOver={dragOver === sub.name}
              onDragEnter={() => handleDragEnter(sub.name)}
              onDragLeave={() => handleDragLeave(sub.name)}
              onDrop={() => handleDrop(sub.name)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onLabelChange={setChannelLabel}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── PhaseTimeline ─────────────────────────────────────────────────────────────

interface PhaseTimelineProps {
  phases: PhaseSegment[];
  subsystems: SubsystemConfig[];
  startT: number;
  endT: number;
}

function PhaseTimeline({ phases, subsystems, startT, endT }: PhaseTimelineProps) {
  const duration = endT - startT;
  if (duration <= 0) return null;

  return (
    <div className="space-y-1.5">
      {subsystems.map((sub) => {
        const segs = phases.filter((p) => p.subsystem === sub.name);
        return (
          <div key={sub.name} className="flex items-center gap-2">
            <span className="w-24 flex-shrink-0 truncate text-right font-mono text-[9px] text-muted-foreground">
              {sub.name}
            </span>
            <div className="relative h-4 flex-1 overflow-hidden rounded border border-border bg-background">
              {segs.map((seg, i) => {
                const left = ((seg.startT - startT) / duration) * 100;
                const width = ((seg.endT - seg.startT) / duration) * 100;
                return (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: segments have no stable id
                    key={i}
                    className="absolute top-0 h-full"
                    style={{ left: `${left}%`, width: `${Math.max(width, 0.2)}%`, backgroundColor: sub.color + "cc" }}
                    title={`${seg.startT.toFixed(2)}s – ${seg.endT.toFixed(2)}s`}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
      {/* Time axis */}
      <div className="flex items-center gap-2">
        <span className="w-24 flex-shrink-0" />
        <div className="relative h-3 flex-1 font-mono text-[9px] text-muted-foreground/40">
          <span className="absolute left-0">{startT.toFixed(0)}s</span>
          <span className="absolute left-1/2 -translate-x-1/2">{((startT + endT) / 2).toFixed(0)}s</span>
          <span className="absolute right-0">{endT.toFixed(0)}s</span>
        </div>
      </div>
    </div>
  );
}

// ── SubsystemRow ──────────────────────────────────────────────────────────────

interface SubsystemRowProps {
  sub: SubsystemConfig;
  channels: { ch: number; label: string }[];
  stats?: { mean: number; peak: number };
  onRename: (name: string) => void;
  onColorChange: (color: string) => void;
  onDelete: () => void;
}

function SubsystemRow({ sub, channels, stats, onRename, onColorChange, onDelete }: SubsystemRowProps) {
  const colorRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(sub.name);
  const [open, setOpen] = useState(false);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== sub.name) onRename(draft.trim());
    else setDraft(sub.name);
  };

  return (
    <div className="rounded-md border border-border bg-card">
      {/* Header row */}
      <div className="flex items-center gap-2 px-2.5 py-2">
        {/* Color swatch */}
        <button
          type="button"
          onClick={() => colorRef.current?.click()}
          className="h-3 w-3 flex-shrink-0 cursor-pointer rounded-full ring-1 ring-border/50 transition-transform hover:scale-125"
          style={{ backgroundColor: sub.color }}
          title="Change color"
        />
        <input type="color" ref={colorRef} value={sub.color} onChange={(e) => onColorChange(e.target.value)} className="sr-only" />

        {/* Name — click to rename */}
        {editing ? (
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") { setEditing(false); setDraft(sub.name); }
            }}
            className="min-w-0 flex-1 rounded border border-primary/50 bg-background px-1 py-0.5 font-mono text-[11px] text-foreground focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => { setDraft(sub.name); setEditing(true); }}
            className="min-w-0 flex-1 truncate text-left font-mono text-[11px] text-foreground hover:text-primary"
            title="Click to rename"
          >
            {sub.name}
          </button>
        )}

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-shrink-0 font-mono text-[10px] text-muted-foreground hover:text-foreground"
          title={open ? "Collapse" : "Show channels"}
        >
          {channels.length}ch {open ? "▲" : "▼"}
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="flex-shrink-0 rounded border border-transparent px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground/50 transition-colors hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
          title="Remove subsystem and return all channels to unassigned"
        >
          Disband
        </button>
      </div>

      {/* Stats row */}
      {stats && (stats.mean > 0 || stats.peak > 0) && (
        <div className="flex gap-3 border-t border-border/40 px-2.5 py-1.5">
          <span className="font-mono text-[9px] text-muted-foreground">
            avg{" "}
            <span className="text-foreground">{stats.mean.toFixed(1)}</span>
            <span className="text-muted-foreground/60">A</span>
          </span>
          <span className="font-mono text-[9px] text-muted-foreground">
            pk{" "}
            <span className="text-foreground">{stats.peak.toFixed(1)}</span>
            <span className="text-muted-foreground/60">A</span>
          </span>
        </div>
      )}

      {/* Collapsible channel list */}
      {open && (
        <ul className="border-t border-border px-3 py-2 space-y-0.5">
          {channels.length === 0 ? (
            <li className="font-mono text-[10px] text-muted-foreground/50">No channels assigned</li>
          ) : (
            channels.map(({ ch, label }) => (
              <li key={ch} className="flex items-center gap-1.5 font-mono text-[10px]">
                <span className="text-muted-foreground text-[8px]">•</span>
                <span className={label ? "text-foreground" : "text-muted-foreground"}>
                  {label || `CH ${ch}`}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

// ── DropZone ──────────────────────────────────────────────────────────────────

interface DropZoneProps {
  name: string;
  label: string;
  color: string;
  channels: number[];
  config: PDHConfig;
  hasChannelData: boolean;
  channelMeans: Record<number, number>;
  channelPeaks: Record<number, number>;
  isDragOver: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onDragStart: (ch: number) => void;
  onDragEnd: () => void;
  onLabelChange: (ch: number, label: string) => void;
}

function DropZone({
  label, color, channels, config, hasChannelData, channelMeans, channelPeaks,
  isDragOver, onDragEnter, onDragLeave, onDrop, onDragStart, onDragEnd, onLabelChange,
}: DropZoneProps) {
  return (
    <div
      className="rounded-lg border transition-colors"
      style={isDragOver ? { borderColor: color, backgroundColor: `${color}12` } : { borderColor: "var(--border)" }}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-2 rounded-t-lg px-3 py-2" style={{ backgroundColor: `${color}18` }}>
        <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
          {label}
        </span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">{channels.length} ch</span>
      </div>

      <div className="flex min-h-[60px] flex-wrap gap-2 p-3">
        {channels.length === 0 && (
          <p className="w-full self-center text-center font-mono text-[10px] text-muted-foreground/40">
            Drag channels here
          </p>
        )}
        {channels.map((ch) => (
          <ChannelCard
            key={ch}
            ch={ch}
            label={config.channels[ch]?.label ?? ""}
            hasChannelData={hasChannelData}
            mean={channelMeans[ch] ?? 0}
            peak={channelPeaks[ch] ?? 0}
            onLabelChange={(l) => onLabelChange(ch, l)}
            onDragStart={() => onDragStart(ch)}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
}

// ── ChannelCard ───────────────────────────────────────────────────────────────

interface ChannelCardProps {
  ch: number;
  label: string;
  hasChannelData: boolean;
  mean: number;
  peak: number;
  onLabelChange: (label: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

function ChannelCard({ ch, label, hasChannelData, mean, peak, onLabelChange, onDragStart, onDragEnd }: ChannelCardProps) {
  const breaker = getChannelBreaker(ch);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="flex cursor-grab flex-col gap-1 rounded border border-border bg-card px-2.5 py-2 active:cursor-grabbing active:opacity-60"
    >
      <div className="flex items-center gap-1.5">
        <span className="select-none text-[8px] text-muted-foreground/40">⠿</span>
        <span className="rounded bg-primary/10 px-1 py-0.5 font-mono text-[9px] font-semibold text-primary">
          CH {ch}
        </span>
        <span className={`rounded px-1 py-0.5 font-mono text-[8px] ${
          breaker === "HIGH" ? "bg-blue-500/10 text-blue-400"
            : breaker === "LOW-SW" ? "bg-amber-500/10 text-amber-400"
            : "bg-emerald-500/10 text-emerald-400"
        }`}>
          {breaker}
        </span>
      </div>

      {hasChannelData && (
        <p className="font-mono text-[10px] text-foreground">
          {mean.toFixed(1)}<span className="text-muted-foreground">A</span>
          <span className="ml-1 text-[9px] text-muted-foreground">{peak.toFixed(1)}pk</span>
        </p>
      )}

      <input
        type="text"
        placeholder="Label…"
        value={label}
        onChange={(e) => onLabelChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onDragStart={(e) => e.stopPropagation()}
        className="w-24 rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px] text-foreground placeholder-muted-foreground/40 focus:border-primary/50 focus:outline-none"
      />
    </div>
  );
}
