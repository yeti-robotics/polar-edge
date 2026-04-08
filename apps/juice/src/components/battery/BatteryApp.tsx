import { useState } from "react";
import { generateDemoData } from "@/services/analysis/demo";
import { mergeData } from "@/services/analysis/merge";
import { parseDSFile } from "@/services/analysis/parse-voltage";
import type { MergedData } from "@/services/analysis/types";
import { parseCANJSON } from "@/services/can/parser";
import { JuiceNav } from "../JuiceNav";
import { BatteryAnalysis } from "./BatteryAnalysis";
import { BatteryLanding } from "./BatteryLanding";

type Phase = "landing" | "analysis";

export function BatteryApp() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [dsFile, setDsFile] = useState<File | null>(null);
  const [canFile, setCanFile] = useState<File | null>(null);
  const [mergedData, setMergedData] = useState<MergedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!dsFile) return;
    setLoading(true);
    setError(null);

    try {
      const dsBuffer = await dsFile.arrayBuffer();
      const result = parseDSFile(dsFile.name, dsBuffer);

      if (!result || result.voltage.length < 10) {
        setError(
          "Could not parse DS log. Make sure it is a .dslog binary or CSV with a voltage column (values 6–15 V)."
        );
        setLoading(false);
        return;
      }

      // Use current from the DS log's PDP channels by default.
      // If a CAN JSON file is provided, it overrides the current source.
      let currentData = result.current.length > 0 ? result.current : null;

      if (canFile) {
        const canText = await canFile.text();
        const canParsed = parseCANJSON(canText);
        if (canParsed) currentData = canParsed;
      }

      const merged = mergeData(result.voltage, currentData, result.channels);
      setMergedData(merged);
      setPhase("analysis");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze files");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    setLoading(true);
    setTimeout(() => {
      const { dsData, canData } = generateDemoData();
      const merged = mergeData(dsData, canData);
      setMergedData(merged);
      setDsFile(null);
      setCanFile(null);
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
        dsFile={dsFile}
        canFile={canFile}
        onDsFileSelect={setDsFile}
        onCanFileSelect={setCanFile}
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
