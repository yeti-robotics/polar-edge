const STORAGE_KEY = "yetiPdhConfig";

export const PDH_CHANNEL_COUNT = 24;
export const PDH_HIGH_COUNT = 20;  // CH 0-19: 40A high-current
export const PDH_LOW_SW = 3;       // CH 20-22: 20A switchable
export const PDH_LOW_AON = 1;      // CH 23: 20A always-on

export const PDH_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#ec4899",
  "#84cc16", "#14b8a6", "#f43f5e", "#a855f7",
];

export interface ChannelConfig {
  label: string;
  subsystem: string;
}

export interface SubsystemConfig {
  name: string;
  color: string;
  weight: number;
}

export interface PDHConfig {
  channels: ChannelConfig[];   // always 24 entries
  subsystems: SubsystemConfig[];
}

export function getChannelBreaker(ch: number): "HIGH" | "LOW-SW" | "AON" {
  if (ch < PDH_HIGH_COUNT) return "HIGH";
  if (ch < PDH_HIGH_COUNT + PDH_LOW_SW) return "LOW-SW";
  return "AON";
}

function ensureLength(channels: ChannelConfig[]): ChannelConfig[] {
  const arr = [...channels];
  while (arr.length < PDH_CHANNEL_COUNT) arr.push({ label: "", subsystem: "" });
  return arr.slice(0, PDH_CHANNEL_COUNT);
}

export function defaultPDHConfig(): PDHConfig {
  return {
    channels: Array.from({ length: PDH_CHANNEL_COUNT }, () => ({ label: "", subsystem: "" })),
    subsystems: [],
  };
}

export function loadPDHConfig(): PDHConfig {
  if (typeof window === "undefined") return defaultPDHConfig();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPDHConfig();
    const parsed = JSON.parse(raw) as PDHConfig;
    parsed.channels = ensureLength(parsed.channels ?? []);
    parsed.subsystems = parsed.subsystems ?? [];
    return parsed;
  } catch {
    return defaultPDHConfig();
  }
}

export function savePDHConfig(config: PDHConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function exportPDHConfig(config: PDHConfig): void {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pdh-config.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function importPDHConfig(file: File): Promise<PDHConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as PDHConfig;
        if (!Array.isArray(parsed.channels) || !Array.isArray(parsed.subsystems)) {
          reject(new Error("Invalid PDH config file."));
          return;
        }
        parsed.channels = ensureLength(parsed.channels);
        resolve(parsed);
      } catch {
        reject(new Error("Could not parse JSON file."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

export function seedDemoConfig(): PDHConfig {
  return {
    channels: [
      { label: "LF Drive Motor",      subsystem: "Drivetrain" },
      { label: "RF Drive Motor",      subsystem: "Drivetrain" },
      { label: "LB Drive Motor",      subsystem: "Drivetrain" },
      { label: "RB Drive Motor",      subsystem: "Drivetrain" },
      { label: "LF Turn Motor",       subsystem: "Drivetrain" },
      { label: "RF Turn Motor",       subsystem: "Drivetrain" },
      { label: "LB Turn Motor",       subsystem: "Drivetrain" },
      { label: "RB Turn Motor",       subsystem: "Drivetrain" },
      { label: "Arm Pivot 1",         subsystem: "Arm" },
      { label: "Arm Pivot 2",         subsystem: "Arm" },
      { label: "Arm Extend",          subsystem: "Arm" },
      { label: "Wrist",               subsystem: "Arm" },
      { label: "Intake Roller 1",     subsystem: "Intake" },
      { label: "Intake Roller 2",     subsystem: "Intake" },
      { label: "Shooter Flywheel 1",  subsystem: "Shooter" },
      { label: "Shooter Flywheel 2",  subsystem: "Shooter" },
      { label: "Climber 1",           subsystem: "Climber" },
      { label: "Climber 2",           subsystem: "Climber" },
      { label: "Feeder/Indexer",      subsystem: "Intake" },
      { label: "Spare",               subsystem: "" },
      { label: "Compressor",          subsystem: "Aux" },
      { label: "LED Controller",      subsystem: "Aux" },
      { label: "Vision Co-Processor", subsystem: "Aux" },
      { label: "Radio (Always-On)",   subsystem: "Aux" },
    ],
    subsystems: [
      { name: "Drivetrain", color: "#3b82f6", weight: 48 },
      { name: "Arm",        color: "#10b981", weight: 20 },
      { name: "Intake",     color: "#f59e0b", weight: 10 },
      { name: "Shooter",    color: "#ef4444", weight: 12 },
      { name: "Climber",    color: "#8b5cf6", weight: 5  },
      { name: "Aux",        color: "#06b6d4", weight: 5  },
    ],
  };
}
