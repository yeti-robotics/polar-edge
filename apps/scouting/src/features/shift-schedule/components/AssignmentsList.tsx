"use client";

import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent } from "@repo/ui/components/card";
import { TypographyMuted } from "@repo/ui/components/typography";
import {
  formatAssignmentTypeLabel,
  formatStandStationLabel,
  getStandStationBadgeClass,
  type ShiftScheduleEntry,
} from "@/features/shift-schedule/types";

type Props = {
  title: string;
  description: string;
  entries: ShiftScheduleEntry[];
  emptyMessage: string;
};

function AssignmentCard({ entry }: { entry: ShiftScheduleEntry }) {
  return (
    <div className="rounded-xl border p-4 text-sm shadow-xs">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium">{entry.name || "Unassigned"}</p>
          <p className="text-muted-foreground">
            {entry.email ?? "No email on file"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {formatAssignmentTypeLabel(entry.assignmentType)}
          </Badge>
          <Badge className={getStandStationBadgeClass(entry.standStation)}>
            {formatStandStationLabel(entry.standStation)}
          </Badge>
          <Badge variant="secondary">
            QM {entry.matchStart}-{entry.matchEnd}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export function AssignmentsList({
  title,
  description,
  entries,
  emptyMessage,
}: Props) {
  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <TypographyMuted>{description}</TypographyMuted>
        </div>

        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="grid gap-3">
            {entries.map((entry) => (
              <AssignmentCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
