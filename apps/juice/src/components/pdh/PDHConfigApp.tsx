import { useCallback, useRef, useState } from "react";
import {
  loadPDHConfig,
  savePDHConfig,
  defaultPDHConfig,
  type PDHConfig,
  type SubsystemConfig,
  PDH_CHANNEL_COUNT,
  PDH_COLORS,
  getChannelBreaker,
} from "@/services/pdh/config";

export function PDHConfigApp() {
  const [config, setConfig] = useState<PDHConfig>(() => loadPDHConfig());
  const [saved, setSaved] = useState(false);

  const persist = useCallback((next: PDHConfig) => {
    setConfig(next);
    savePDHConfig(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  // ── Subsystem management ─────────────────────────────────────

  const addSubsystem = () => {
    const idx = config.subsystems.length % PDH_COLORS.length;
    persist({
      ...config,
      subsystems: [
        ...config.subsystems,
        { name: `Subsystem ${config.subsystems.length + 1}`, color: PDH_COLORS[idx] ?? "#3b82f6", weight: 0 },
      ],
    });
  };

  const updateSubsystem = (i: number, patch: Partial<SubsystemConfig>) => {
    const subs = [...config.subsystems];
    subs[i] = { ...subs[i]!, ...patch };
    persist({ ...config, subsystems: subs });
  };

  const renameSubsystem = (oldName: string, newName: string) => {
    persist({
      ...config,
      subsystems: config.subsystems.map((s) => (s.name === oldName ? { ...s, name: newName } : s)),
      channels: config.channels.map((ch) =>
        ch.subsystem === oldName ? { ...ch, subsystem: newName } : ch
      ),
    });
  };

  const deleteSubsystem = (name: string) => {
    persist({
      ...config,
      subsystems: config.subsystems.filter((s) => s.name !== name),
      channels: config.channels.map((ch) =>
        ch.subsystem === name ? { ...ch, subsystem: "" } : ch
      ),
    });
  };

  const resetAll = () => persist(defaultPDHConfig());

  // ── Channel label editing ─────────────────────────────────────

  const setLabel = (ch: number, label: string) => {
    const channels = [...config.channels];
    channels[ch] = { ...channels[ch]!, label };
    persist({ ...config, channels });
  };

  // ── Drag-and-drop ─────────────────────────────────────────────

  const [dragging, setDragging] = useState<number | null>(null); // channel index being dragged
  const [dragOver, setDragOver] = useState<string | null>(null); // subsystem name (or "__unassigned")
  const dragCounters = useRef<Record<string, number>>({});

  const handleDragStart = (ch: number) => setDragging(ch);
  const handleDragEnd = () => { setDragging(null); setDragOver(null); };

  const handleDragEnter = (zone: string) => {
    dragCounters.current[zone] = (dragCounters.current[zone] ?? 0) + 1;
    setDragOver(zone);
  };

  const handleDragLeave = (zone: string) => {
    dragCounters.current[zone] = (dragCounters.current[zone] ?? 1) - 1;
    if ((dragCounters.current[zone] ?? 0) <= 0) {
      dragCounters.current[zone] = 0;
      setDragOver((prev) => (prev === zone ? null : prev));
    }
  };

  const handleDrop = (zone: string) => {
    if (dragging === null) return;
    const newSubsystem = zone === "__unassigned" ? "" : zone;
    const channels = [...config.channels];
    channels[dragging] = { ...channels[dragging]!, subsystem: newSubsystem };
    persist({ ...config, channels });
    dragCounters.current = {};
    setDragOver(null);
  };

  const totalWeight = config.subsystems.reduce((s, sub) => s + sub.weight, 0);

  // Channels by zone
  const channelsByZone = (zoneName: string) =>
    Array.from({ length: PDH_CHANNEL_COUNT }, (_, i) => i).filter((ch) => {
      const cfg = config.channels[ch];
      const sub = cfg?.subsystem ?? "";
      return zoneName === "__unassigned" ? sub === "" : sub === zoneName;
    });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
        <a href="/analyzer" className="font-mono text-xs text-muted-foreground hover:text-primary">
          ← Back to Analyzer
        </a>
        <span className="ml-2 font-mono text-sm font-semibold text-primary">PDH Configuration</span>
        {saved && (
          <span className="ml-auto rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
            Saved ✓
          </span>
        )}
        <button
          type="button"
          onClick={resetAll}
          className="ml-auto rounded border border-border px-3 py-1 font-mono text-[10px] text-muted-foreground hover:border-destructive/40 hover:text-destructive"
        >
          Reset all
        </button>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-6 p-6">
        {/* ── Left panel: subsystem definitions ── */}
        <aside className="w-72 flex-shrink-0">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Subsystems
              </h2>
              <span
                className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold ${
                  totalWeight === 100
                    ? "bg-emerald-500/10 text-emerald-400"
                    : totalWeight > 100
                      ? "bg-red-500/10 text-red-400"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                Σ {totalWeight}%
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {config.subsystems.map((sub, i) => (
                <SubsystemRow
                  key={sub.name}
                  sub={sub}
                  onColorChange={(color) => updateSubsystem(i, { color })}
                  onNameChange={(name) => renameSubsystem(sub.name, name)}
                  onWeightChange={(weight) => updateSubsystem(i, { weight })}
                  onDelete={() => deleteSubsystem(sub.name)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addSubsystem}
              className="mt-3 w-full rounded border border-dashed border-border py-1.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              + Add subsystem
            </button>

            <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
              Drag channel cards on the right into subsystem zones. Weight % is used for estimated
              current breakdown when no per-channel log data is available.
            </p>
          </div>
        </aside>

        {/* ── Right panel: drop zones ── */}
        <main className="min-w-0 flex-1">
          {/* Unassigned zone */}
          <DropZone
            name="__unassigned"
            label="Unassigned"
            color="#6b7280"
            channels={channelsByZone("__unassigned")}
            config={config}
            isDragOver={dragOver === "__unassigned"}
            onDragEnter={() => handleDragEnter("__unassigned")}
            onDragLeave={() => handleDragLeave("__unassigned")}
            onDrop={() => handleDrop("__unassigned")}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onLabelChange={setLabel}
          />

          {config.subsystems.map((sub) => (
            <DropZone
              key={sub.name}
              name={sub.name}
              label={sub.name}
              color={sub.color}
              channels={channelsByZone(sub.name)}
              config={config}
              isDragOver={dragOver === sub.name}
              onDragEnter={() => handleDragEnter(sub.name)}
              onDragLeave={() => handleDragLeave(sub.name)}
              onDrop={() => handleDrop(sub.name)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onLabelChange={setLabel}
            />
          ))}
        </main>
      </div>
    </div>
  );
}

// ── SubsystemRow ──────────────────────────────────────────────────────────────

interface SubsystemRowProps {
  sub: SubsystemConfig;
  onColorChange: (color: string) => void;
  onNameChange: (name: string) => void;
  onWeightChange: (weight: number) => void;
  onDelete: () => void;
}

function SubsystemRow({ sub, onColorChange, onNameChange, onWeightChange, onDelete }: SubsystemRowProps) {
  const colorRef = useRef<HTMLInputElement>(null);
  const [editName, setEditName] = useState(sub.name);

  return (
    <div className="flex items-center gap-2 rounded border border-border bg-background px-2 py-1.5">
      {/* Color circle */}
      <button
        type="button"
        onClick={() => colorRef.current?.click()}
        className="h-4 w-4 flex-shrink-0 cursor-pointer rounded-full border border-border/50 transition-transform hover:scale-110"
        style={{ backgroundColor: sub.color }}
        title="Change color"
      />
      <input
        ref={colorRef}
        type="color"
        value={sub.color}
        onChange={(e) => onColorChange(e.target.value)}
        className="sr-only"
      />

      {/* Name */}
      <input
        type="text"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        onBlur={() => { if (editName.trim()) onNameChange(editName.trim()); else setEditName(sub.name); }}
        className="min-w-0 flex-1 bg-transparent font-mono text-[11px] text-foreground focus:outline-none"
      />

      {/* Weight */}
      <input
        type="number"
        min={0}
        max={100}
        value={sub.weight}
        onChange={(e) => onWeightChange(Number(e.target.value))}
        className="w-10 rounded border border-border bg-card px-1 py-0.5 text-center font-mono text-[10px] text-foreground focus:border-primary/50 focus:outline-none"
      />
      <span className="font-mono text-[9px] text-muted-foreground">%</span>

      <button
        type="button"
        onClick={onDelete}
        className="rounded px-1 font-mono text-[11px] text-muted-foreground hover:text-destructive"
      >
        ×
      </button>
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
  isDragOver: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onDragStart: (ch: number) => void;
  onDragEnd: () => void;
  onLabelChange: (ch: number, label: string) => void;
}

function DropZone({
  name,
  label,
  color,
  channels,
  config,
  isDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
  onLabelChange,
}: DropZoneProps) {
  return (
    <div
      className="mb-4 rounded-lg border border-border transition-colors"
      style={isDragOver ? { borderColor: color, backgroundColor: color + "10" } : undefined}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div
        className="flex items-center gap-2 rounded-t-lg px-3 py-2"
        style={{ backgroundColor: color + "18" }}
      >
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
          {label}
        </span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          {channels.length} ch
        </span>
      </div>

      <div className="flex flex-wrap gap-2 p-3">
        {channels.length === 0 && (
          <p className="w-full py-2 text-center font-mono text-[10px] text-muted-foreground/50">
            Drop channels here
          </p>
        )}
        {channels.map((ch) => (
          <ChannelCard
            key={ch}
            ch={ch}
            label={config.channels[ch]?.label ?? ""}
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
  onLabelChange: (label: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

function ChannelCard({ ch, label, onLabelChange, onDragStart, onDragEnd }: ChannelCardProps) {
  const breaker = getChannelBreaker(ch);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="flex cursor-grab items-center gap-2 rounded border border-border bg-card px-2 py-1.5 active:cursor-grabbing"
    >
      {/* Drag handle dots */}
      <span className="select-none text-muted-foreground/40" style={{ fontSize: 9, letterSpacing: 1 }}>
        ⠿
      </span>

      <span className="rounded bg-primary/10 px-1 py-0.5 font-mono text-[9px] font-semibold text-primary">
        {ch}
      </span>

      <span
        className={`rounded px-1 py-0.5 font-mono text-[8px] ${
          breaker === "HIGH"
            ? "bg-blue-500/10 text-blue-400"
            : breaker === "LOW-SW"
              ? "bg-amber-500/10 text-amber-400"
              : "bg-emerald-500/10 text-emerald-400"
        }`}
      >
        {breaker}
      </span>

      <input
        type="text"
        placeholder="Label…"
        value={label}
        onChange={(e) => onLabelChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onDragStart={(e) => e.stopPropagation()}
        className="w-28 bg-transparent font-mono text-[10px] text-foreground placeholder-muted-foreground/40 focus:outline-none"
      />
    </div>
  );
}
