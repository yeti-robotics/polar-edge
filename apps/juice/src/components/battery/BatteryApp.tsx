import { useState } from "react";
import { generateDemoData } from "@/services/analysis/demo";
import { mergeData } from "@/services/analysis/merge";
import { parseDSFile } from "@/services/analysis/parse-voltage";
import type { MergedData } from "@/services/analysis/types";
import { loadPDHConfig, savePDHConfig, seedDemoConfig } from "@/services/pdh/config";
import { JuiceNav } from "../JuiceNav";
import { BatteryAnalysis } from "./BatteryAnalysis";
import { BatteryLanding } from "./BatteryLanding";

type Phase = "landing" | "analysis";

export function BatteryApp() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [logFile, setLogFile] = useState<File | null>(null);
  const [mergedData, setMergedData] = useState<MergedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!logFile) return;
    setLoading(true);
    setError(null);

    try {
      const buffer = await logFile.arrayBuffer();
      const result = parseDSFile(logFile.name, buffer);

      if (!result || result.voltage.length < 10) {
        setError(
          "Could not parse the log file. Supported formats: .dslog binary, .wpilog binary, or CSV with a voltage column (values 6–15 V)."
        );
        setLoading(false);
        return;
      }

      const currentData = result.current.length > 0 ? result.current : null;
      const merged = mergeData(result.voltage, currentData, result.channels);
      setMergedData(merged);
      setPhase("analysis");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze file");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    setLoading(true);
    setTimeout(() => {
      const { dsData, canData, channels } = generateDemoData();
      const merged = mergeData(dsData, canData, channels);

      // Seed PDH config with realistic FRC labels if the user hasn't set any yet
      const cfg = loadPDHConfig();
      const hasLabels = cfg.channels.some((ch) => ch.label !== "");
      if (!hasLabels) savePDHConfig(seedDemoConfig());

      setMergedData(merged);
      setLogFile(null);
      setPhase("analysis");
      setLoading(false);
    }, 50);
  };

  const handleNewFiles = () => {
    setPhase("landing");
    setMergedData(null);
  };

  if (phase === "analysis" && mergedData) {
    return <BatteryAnalysis data={mergedData} onNewFiles={handleNewFiles} />;
  }

  return (
    <>
      <JuiceNav active="analyzer" />
      <BatteryLanding
        logFile={logFile}
        onLogFileSelect={setLogFile}
        onAnalyze={handleAnalyze}
        onDemo={handleDemo}
        loading={loading}
      />
      {error && (
        <div className="mx-auto max-w-lg px-6 pb-6">
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        </div>
      )}
    </>
  );
}
