import { Button } from "@repo/ui/components/button";
import { FileUploadCard } from "./FileUploadCard";

interface BatteryLandingProps {
  logFile: File | null;
  onLogFileSelect: (file: File) => void;
  onAnalyze: () => void;
  onDemo: () => void;
  loading: boolean;
}

export function BatteryLanding({
  logFile,
  onLogFileSelect,
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
        Upload your{" "}
        <strong className="text-foreground">DS Log</strong> to analyze battery voltage, current
        demand, and per-channel PDH power distribution.
      </p>

      <div className="mb-7 mx-auto w-full max-w-xl">
        <FileUploadCard
          label="Required"
          title="DS Log File"
          description={
            <>
              <code className="rounded bg-primary/10 px-1 py-0.5 font-mono text-[11px] text-primary">
                .dslog
              </code>{" "}
              binary — provides voltage, current, and PDH channel data.
            </>
          }
          icon="📋"
          accept="*"
          file={logFile}
          variant="required"
          onFileSelect={(f) => {
            if (!f.name.toLowerCase().endsWith(".dslog")) {
              alert("Please select a .dslog file.");
              return;
            }
            onLogFileSelect(f);
          }}
        />
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button onClick={onAnalyze} disabled={!logFile || loading} className="px-10">
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

      <div className="mt-9 grid w-full max-w-[500px] grid-cols-1 gap-3 sm:grid-cols-2">
        <HintCard title="DS Log files">
          The{" "}
          <code className="text-primary">.dslog</code> binary contains voltage, PDP/PDH channel
          currents, trip time, packet loss, CAN utilization, and more — all parsed natively.
        </HintCard>
        <HintCard title="What gets analyzed?">
          Voltage trends, current demand, instantaneous power{" "}
          <span className="inline-flex items-baseline gap-0.5 rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-foreground">
            <i>P</i> = <i>V</i> × <i>I</i>
          </span>
          , battery impedance, and a per-subsystem PDH breakdown with rolling windows and CSV
          export.
        </HintCard>
      </div>
    </div>
  );
}

function HintCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-card/50 p-3.5">
      <h4 className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-primary">
        {title}
      </h4>
      <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
