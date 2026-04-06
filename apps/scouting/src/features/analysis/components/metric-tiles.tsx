import { TypographyLabel, TypographySmall } from "@repo/ui/components/typography";
import { cn } from "@repo/ui/lib/utils";

export function MetricTile({
  label,
  value,
  unit,
  description,
  valueClass,
}: {
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <TypographyLabel>{label}</TypographyLabel>
      <p className={cn("text-2xl font-bold tabular-nums tracking-tight leading-none", valueClass)}>
        {value}
        {unit && (
          <TypographySmall className="font-normal text-muted-foreground ml-1">
            {unit}
          </TypographySmall>
        )}
      </p>
      {description && (
        <TypographySmall className="text-muted-foreground/70 leading-tight">
          {description}
        </TypographySmall>
      )}
    </div>
  );
}

export function AdvancedMetricTile({
  acronym,
  fullName,
  value,
  description,
  valueClass,
}: {
  acronym: string;
  fullName: string;
  value: string | number;
  description: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border p-4">
      <div>
        <TypographyLabel>{acronym}</TypographyLabel>
        <TypographySmall className="text-muted-foreground/70 leading-tight mt-0.5">
          {fullName}
        </TypographySmall>
      </div>
      <p className={cn("text-3xl font-bold tabular-nums tracking-tight leading-none", valueClass)}>
        {value}
      </p>
      <TypographySmall className="text-muted-foreground/70 leading-tight">
        {description}
      </TypographySmall>
    </div>
  );
}
