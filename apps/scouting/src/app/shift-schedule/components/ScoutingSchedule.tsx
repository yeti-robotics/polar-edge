"use client";

import { Card, CardContent } from "@repo/ui/components/card";
import { TypographyMuted } from "@repo/ui/components/typography";
import { useMemo } from "react";
import type { ShiftScheduleEntry } from "@/features/shift-schedule/types";
import AdminEditSchedule from "./AdminEditSchedule";

type Props = {
  isAdmin: boolean;
  initialEntries: ShiftScheduleEntry[];
  eventName: string | null;
};

export default function ScoutingPage({
  isAdmin,
  initialEntries,
  eventName,
}: Props) {
  const sortedEntries = useMemo(
    () =>
      (initialEntries ?? [])
        .slice()
        .sort((a, b) => (a.shift ?? "").localeCompare(b.shift ?? "")),
    [initialEntries],
  );

  const hasSchedule = sortedEntries.length > 0;
  const eventLabel = eventName ?? "active event";

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-6 space-y-3">
          <p className="text-sm font-medium">Schedule for {eventLabel}</p>
          <TypographyMuted>View-only access.</TypographyMuted>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Schedule for {eventLabel}</p>
          </div>
        </div>

        {hasSchedule ? (
          <div className="grid gap-3">
            {sortedEntries.map((entry) => (
              <div key={entry.id} className="border px-3 py-2 text-sm">
                <div className="font-medium">
                  {entry.name || "Unassigned"} · {entry.role || "Role TBD"}
                </div>
                <div>
                  {entry.shift || "Shift TBD"}
                  {entry.notes ? ` • ${entry.notes}` : ""}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="border border-dashed p-4 text-sm">
              No schedule yet.
            </div>
            <AdminEditSchedule />
          </>
        )}
      </CardContent>
    </Card>
  );
}
