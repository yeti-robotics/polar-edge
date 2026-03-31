import { useMemo } from "react";
import { computeImpedance, computePower, estimateOCV } from "@/services/analysis/battery";
import type { MergedData } from "@/services/analysis/types";
import { AnalysisNav } from "./AnalysisNav";
import { CurrentSection } from "./CurrentSection";
import { ImpedanceSection } from "./ImpedanceSection";
import { PowerSection } from "./PowerSection";
import { VoltageSection } from "./VoltageSection";

interface BatteryAnalysisProps {
  data: MergedData;
  onNewFiles: () => void;
}

export function BatteryAnalysis({ data, onNewFiles }: BatteryAnalysisProps) {
  const ocv = useMemo(() => estimateOCV(data.volts), [data.volts]);

  const power = useMemo(() => computePower(data.volts, data.currents), [data.volts, data.currents]);

  const impedanceSamples = useMemo(
    () => computeImpedance(data.times, data.volts, data.currents, ocv, data.dt),
    [data, ocv]
  );

  return (
    <div className="min-h-screen">
      <AnalysisNav onNewFiles={onNewFiles} />
      <VoltageSection data={data} ocv={ocv} />
      <CurrentSection data={data} />
      <PowerSection data={data} power={power} />
      <ImpedanceSection samples={impedanceSamples} dt={data.dt} />
    </div>
  );
}
