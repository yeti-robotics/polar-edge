"use client";
import type { ChangeEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { TypographyMuted } from "@repo/ui/components/typography";
import { UploadIcon } from "lucide-react";
import type { ShiftScheduleEntry } from "@/features/shift-schedule/types";

type AdminEditingProps = {
  isAdmin: boolean;
  initialEntries: ShiftScheduleEntry[];
  eventName: string | null;
};

export default function AdminEditing({ isAdmin, initialEntries, eventName }: AdminEditingProps) {
  const [entries, setEntries] = useState<ShiftScheduleEntry[]>(initialEntries);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hasActiveEvent = Boolean(eventName);
  const hasSchedule = entries.length > 0;
  const eventLabel = eventName ?? "active event";

  const sortedEntries = useMemo(
    () =>
      entries
        .slice()
        .sort((a, b) => (a.shift ?? "").localeCompare(b.shift ?? "")),
    [entries]
  );

  const openFilePicker = () => {
    setError(null);
    setSuccess(null);
    fileInputRef.current?.click();
  };

  const parseCsvLine = (line: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
          continue;
        }
        inQuotes = !inQuotes;
        continue;
      }
      if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
        continue;
      }
      current += char;
    }
    result.push(current.trim());
    return result;
  };

  const normalizeEntries = (rows: string[][]) => {
    const entries: ShiftScheduleEntry[] = [];
    for (const row of rows) {
      if (!row.some((cell) => cell.trim().length > 0)) continue;
      const [name = "", role = "", shift = "", notes = ""] = row;
      entries.push({
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: name.trim(),
        role: role.trim(),
        shift: shift.trim(),
        notes: notes.trim(),
      });
    }
    return entries;
  };

  const readStringField = (value: unknown) => (typeof value === "string" ? value : "");

  const handleFileImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const text = await file.text();
      let nextEntries: ShiftScheduleEntry[] = [];
      if (file.name.toLowerCase().endsWith(".json")) {
        const parsed = JSON.parse(text) as unknown;
        if (Array.isArray(parsed)) {
          nextEntries = normalizeEntries(
            parsed.map((row) =>
              Array.isArray(row) ? row.map((cell) => String(cell ?? "")) : []
            )
          );
        } else if (parsed && typeof parsed === "object" && "entries" in parsed) {
          const rows = Array.isArray((parsed as { entries?: unknown[] }).entries)
            ? ((parsed as { entries?: unknown[] }).entries as unknown[])
            : [];
          nextEntries = rows.map((entry) => ({
            id:
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name: readStringField((entry as { name?: unknown })?.name),
            role: readStringField((entry as { role?: unknown })?.role),
            shift: readStringField((entry as { shift?: unknown })?.shift),
            notes: readStringField((entry as { notes?: unknown })?.notes),
          }));
        } else {
          throw new Error("JSON must be an array or an object with an entries array.");
        }
      } else {
        const lines = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        const rows = lines.map(parseCsvLine);
        nextEntries = normalizeEntries(rows);
      }

      if (!nextEntries.length) {
        throw new Error("No usable rows found in the import file.");
      }

      setIsSaving(true);
      const response = await fetch("/api/shift-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: nextEntries }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to save schedule.");
      }
      const payload = (await response.json()) as { entries?: ShiftScheduleEntry[] };
      const savedEntries = Array.isArray(payload.entries) ? payload.entries : nextEntries;
      setEntries(savedEntries);
      setSuccess("Schedule imported and saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import file.");
    } finally {
      setIsSaving(false);
      event.target.value = "";
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-6 space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Schedule for {eventLabel}</p>
            <TypographyMuted className="mt-1">
              View-only access. Ask an admin to update shifts.
            </TypographyMuted>
          </div>
          {hasSchedule ? (
            <div className="grid gap-3">
              {sortedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-md border border-muted bg-muted/20 px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                    <span>{entry.name || "Unassigned"}</span>
                    <span className="text-muted-foreground">·</span>
                    <span>{entry.role || "Role TBD"}</span>
                  </div>
                  <div className="text-muted-foreground mt-1">
                    {entry.shift || "Shift TBD"}
                    {entry.notes ? ` • ${entry.notes}` : ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No schedule has been published yet.
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Schedule for {eventLabel}</p>
            <TypographyMuted className="mt-1">
              Import a CSV or JSON file to update the schedule for the active event.
            </TypographyMuted>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={openFilePicker} disabled={!hasActiveEvent || isSaving}>
              <UploadIcon className="size-4 mr-2" />
              {isSaving ? "Saving..." : "Import Schedule"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={handleFileImport}
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        {hasSchedule ? (
          <div className="grid gap-3">
            {sortedEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-md border border-muted bg-muted/20 px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                  <span>{entry.name || "Unassigned"}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{entry.role || "Role TBD"}</span>
                </div>
                <div className="text-muted-foreground mt-1">
                  {entry.shift || "Shift TBD"}
                  {entry.notes ? ` • ${entry.notes}` : ""}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No schedule has been published yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
