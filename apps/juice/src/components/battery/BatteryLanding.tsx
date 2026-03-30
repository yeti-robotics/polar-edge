import { Button } from "@repo/ui/components/button";
import { FileUploadCard } from "./FileUploadCard";

interface BatteryLandingProps {
  dsFile: File | null;
  canFile: File | null;
  onDsFileSelect: (file: File) => void;
  onCanFileSelect: (file: File) => void;
  onAnalyze: () => void;
  onDemo: () => void;
  loading: boolean;
}

export function BatteryLanding({
  dsFile,
  canFile,
  onDsFileSelect,
  onCanFileSelect,
  onAnalyze,
  onDemo,
  loading,
}: BatteryLandingProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <span className="mb-8 font-mono text-2xl font-bold uppercase tracking-widest text-primary">
        JUICE
      </span>

      <h1 className="mb-3 text-center text-3xl font-medium tracking-tight text-foreground">
        Battery Analysis
      </h1>

      <p className="mb-12 max-w-lg text-center text-sm leading-relaxed text-muted-foreground">
        Upload your <strong className="text-foreground">DS Log</strong>{" "}
        to analyze battery voltage and current from PDP/PDH channels.
        Optionally add a{" "}
        <strong className="text-foreground">CAN JSON</strong> to override
        the current source with per-device CAN bus data.
      </p>

      <div className="mb-7 grid w-full max-w-[700px] grid-cols-1 gap-4 sm:grid-cols-2">
        <FileUploadCard
          label="Required"
          title="DS Log"
          description={
            <>
              <code className="rounded bg-primary/10 px-1 py-0.5 font-mono text-[11px] text-primary">
                .dslog
              </code>{" "}
              binary or{" "}
              <code className="rounded bg-primary/10 px-1 py-0.5 font-mono text-[11px] text-primary">
                .csv
              </code>{" "}
              export.
              <br />
              Provides voltage and PDP/PDH current at ~50 Hz.
            </>
          }
          icon="📋"
          accept="*"
          file={dsFile}
          variant="required"
          onFileSelect={onDsFileSelect}
        />
        <FileUploadCard
          label="Optional"
          title="CAN JSON"
          description={
            <>
              Overrides PDP current with per-device CAN bus data.
              <br />
              JSON array with{" "}
              <code className="rounded bg-amber-500/10 px-1 py-0.5 font-mono text-[11px] text-amber-500">
                time
              </code>{" "}
              and current fields per device.
            </>
          }
          icon="🔌"
          accept=".json,.txt,.csv,*"
          file={canFile}
          variant="optional"
          onFileSelect={onCanFileSelect}
        />
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button
          onClick={onAnalyze}
          disabled={!dsFile || loading}
          className="px-10"
        >
          {loading ? "Analyzing..." : "⚡ Analyze"}
        </Button>
        <Button
          variant="outline"
          onClick={onDemo}
          disabled={loading}
          className="text-muted-foreground"
        >
          Load demo match data
        </Button>
      </div>

      <div className="mt-9 grid w-full max-w-[700px] grid-cols-1 gap-3 sm:grid-cols-3">
        <HintCard title="DS Log files">
          The <code className="text-primary">.dslog</code> binary
          contains voltage, PDP/PDH channel currents, trip time, packet
          loss, CAN utilization, and more — all parsed natively.
        </HintCard>
        <HintCard title="CAN JSON override">
          Optionally provide a CAN JSON to replace PDP current with
          per-device CAN bus readings — useful for more granular current
          profiling via WPILib or AdvantageScope.
        </HintCard>
        <HintCard title="What gets analyzed?">
          Voltage trends, current demand, instantaneous power{" "}
          <span className="inline-flex items-baseline gap-0.5 rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-foreground">
            <i>P</i> = <i>V</i> × <i>I</i>
          </span>
          , and battery impedance{" "}
          <span className="inline-flex items-baseline gap-0.5 rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-foreground">
            <i>R</i> = (<i>V</i><sub>oc</sub> − <i>V</i>) / <i>I</i>
          </span>{" "}
          — all with rolling windows, regression lines, and CSV export.
        </HintCard>
      </div>
    </div>
  );
}

function HintCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-card/50 p-3.5">
      <h4 className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-primary">
        {title}
      </h4>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  );
}
