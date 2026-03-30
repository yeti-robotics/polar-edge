type StatColor = "green" | "yellow" | "red" | "blue" | "purple";

interface StatCardProps {
  label: string;
  value: string;
  unit: string;
  note: string;
  color: StatColor;
}

const borderColors: Record<StatColor, string> = {
  green: "border-l-emerald-500",
  yellow: "border-l-amber-500",
  red: "border-l-red-500",
  blue: "border-l-blue-500",
  purple: "border-l-violet-500",
};

export function StatCard({ label, value, unit, note, color }: StatCardProps) {
  return (
    <div
      className={`rounded-md border border-border bg-card p-3 border-l-2 ${borderColors[color]}`}
    >
      <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-xl font-semibold leading-none text-foreground">
        {value}
        <span className="ml-0.5 text-xs font-normal text-muted-foreground">
          {unit}
        </span>
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
    </div>
  );
}
