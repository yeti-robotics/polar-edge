"use client";

import { Fragment } from "react";
import { Card, CardContent } from "@repo/ui/components/card";
import { TypographyMuted } from "@repo/ui/components/typography";
import {
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

type MemberRow = {
  memberId: string;
  name: string;
  email: string | null;
  assignmentsByBlock: Map<string, ShiftScheduleEntry[]>;
};

function getBlockKey(entry: ShiftScheduleEntry) {
  return `${entry.matchStart ?? "na"}-${entry.matchEnd ?? "na"}`;
}

function getBlockLabel(entry: ShiftScheduleEntry) {
  if (!entry.matchStart || !entry.matchEnd) {
    return "Block TBD";
  }

  return entry.matchStart === entry.matchEnd
    ? `QM ${entry.matchStart}`
    : `QM ${entry.matchStart}-${entry.matchEnd}`;
}

function buildRows(entries: ShiftScheduleEntry[]) {
  const blockMap = new Map<string, string>();
  const memberMap = new Map<string, MemberRow>();

  for (const entry of entries) {
    const blockKey = getBlockKey(entry);
    blockMap.set(blockKey, getBlockLabel(entry));

    const memberKey = entry.memberId ?? entry.id;
    const existing = memberMap.get(memberKey);

    if (existing) {
      const cellEntries = existing.assignmentsByBlock.get(blockKey) ?? [];
      cellEntries.push(entry);
      existing.assignmentsByBlock.set(blockKey, cellEntries);
      continue;
    }

    memberMap.set(memberKey, {
      memberId: memberKey,
      name: entry.name || "Unassigned",
      email: entry.email,
      assignmentsByBlock: new Map([[blockKey, [entry]]]),
    });
  }

  const blocks = [...blockMap.entries()]
    .map(([key, label]) => {
      const startValue = Number(key.split("-")[0]);
      return {
        key,
        label,
        start: Number.isNaN(startValue) ? Number.MAX_SAFE_INTEGER : startValue,
      };
    })
    .sort((a, b) => a.start - b.start);

  const rows = [...memberMap.values()].sort((a, b) => a.name.localeCompare(b.name));

  return { blocks, rows };
}

function AssignmentCell({ entries }: { entries: ShiftScheduleEntry[] | undefined }) {
  if (!entries || entries.length === 0) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((entry) => (
        <span
          key={entry.id}
          className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${getStandStationBadgeClass(entry.standStation)}`}
        >
          {formatStandStationLabel(entry.standStation)}
        </span>
      ))}
    </div>
  );
}

export function AssignmentsSpreadsheet({ title, description, entries, emptyMessage }: Props) {
  const { blocks, rows } = buildRows(entries);

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
          <div className="overflow-x-auto rounded-xl border border-red-200">
            <div
              className="grid min-w-[720px] text-sm"
              style={{ gridTemplateColumns: `minmax(220px, 1.4fr) repeat(${blocks.length}, minmax(140px, 1fr))` }}
            >
              <div className="border-b border-r border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-900">
                Scout
              </div>
              {blocks.map((block) => (
                <div
                  key={block.key}
                  className="border-b border-r border-red-200 bg-red-50 px-4 py-3 text-center font-semibold text-red-900 last:border-r-0"
                >
                  {block.label}
                </div>
              ))}

              {rows.map((row) => (
                <Fragment key={row.memberId}>
                  <div
                    key={`${row.memberId}-member`}
                    className="border-b border-r border-red-100 bg-white px-4 py-3"
                  >
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.email ?? "No email on file"}</p>
                  </div>
                  {blocks.map((block) => (
                    <div
                      key={`${row.memberId}-${block.key}`}
                      className="border-b border-r border-red-100 bg-white px-4 py-3 last:border-r-0"
                    >
                      <AssignmentCell entries={row.assignmentsByBlock.get(block.key)} />
                    </div>
                  ))}
                </Fragment>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
