import { z } from "zod";

const LEGACY_SHIFT_ASSIGNMENT_TYPES = ["stand", "pit"] as const;
export const STAND_STATIONS = ["red1", "red2", "red3", "blue1", "blue2", "blue3"] as const;

const ShiftAssignmentTypeSchema = z.enum(LEGACY_SHIFT_ASSIGNMENT_TYPES);
export const StandStationSchema = z.enum(STAND_STATIONS);

export const ShiftScheduleEntrySchema = z.object({
  id: z.string(),
  memberId: z.string().nullable(),
  name: z.string(),
  email: z.string().nullable(),
  assignmentType: ShiftAssignmentTypeSchema.optional(),
  standStation: StandStationSchema.nullable(),
  matchStart: z.number().int().nullable(),
  matchEnd: z.number().int().nullable(),
});

export const ShiftSchedulePayloadSchema = z.object({
  entries: z.array(ShiftScheduleEntrySchema).max(200),
});

export type ShiftScheduleEntry = z.infer<typeof ShiftScheduleEntrySchema>;

export type ShiftScheduleMatchBlock = {
  start: number;
  end: number;
  label: string;
};

export function normalizeShiftScheduleEntries(payload: unknown): ShiftScheduleEntry[] {
  const parsed = z.array(ShiftScheduleEntrySchema).safeParse(payload);
  if (!parsed.success) {
    return [];
  }

  return parsed.data.map((entry) => ({
    ...entry,
    memberId: entry.memberId ?? null,
    email: entry.email ?? null,
    assignmentType: "stand",
    standStation: entry.standStation ?? null,
    matchStart: entry.matchStart ?? null,
    matchEnd: entry.matchEnd ?? null,
  }));
}

export function buildStandMatchBlocks(matchNumbers: number[]): ShiftScheduleMatchBlock[] {
  const sorted = [...new Set(matchNumbers)].sort((a, b) => a - b);
  const blocks: ShiftScheduleMatchBlock[] = [];

  for (let index = 0; index < sorted.length; index += 5) {
    const chunk = sorted.slice(index, index + 5);
    if (chunk.length === 0) continue;

    const start = chunk[0];
    const end = chunk.at(-1);
    if (start === undefined || end === undefined) continue;

    blocks.push({
      start,
      end,
      label: start === end ? `QM ${start}` : `QM ${start}-${end}`,
    });
  }

  return blocks;
}

export function formatAssignmentTypeLabel(_type?: ShiftScheduleEntry["assignmentType"]) {
  return "Stand Form";
}

export function formatStandStationLabel(station: ShiftScheduleEntry["standStation"]) {
  if (!station) return "Stand Slot TBD";

  const alliance = station.startsWith("red") ? "Red" : "Blue";
  const position = station.slice(-1);
  return `${alliance} ${position}`;
}

export function getStandStationBadgeClass(station: ShiftScheduleEntry["standStation"]) {
  if (!station) {
    return "border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-100";
  }

  return station.startsWith("blue")
    ? "border-blue-300 bg-blue-100 text-blue-800 hover:bg-blue-100"
    : "border-red-300 bg-red-100 text-red-800 hover:bg-red-100";
}
