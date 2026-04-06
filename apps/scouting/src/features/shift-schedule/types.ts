import { z } from "zod";

export const SHIFT_ASSIGNMENT_TYPES = ["stand", "pit"] as const;
export const STAND_STATIONS = ["red1", "red2", "red3", "blue1", "blue2", "blue3"] as const;

export const ShiftAssignmentTypeSchema = z.enum(SHIFT_ASSIGNMENT_TYPES);
export const StandStationSchema = z.enum(STAND_STATIONS);

export const ShiftScheduleEntrySchema = z.object({
  id: z.string(),
  memberId: z.string().nullable(),
  name: z.string(),
  email: z.string().nullable(),
  assignmentType: ShiftAssignmentTypeSchema,
  standStation: StandStationSchema.nullable(),
  matchStart: z.number().int().nullable(),
  matchEnd: z.number().int().nullable(),
  notes: z.string().nullable(),
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
    standStation: entry.standStation ?? null,
    matchStart: entry.matchStart ?? null,
    matchEnd: entry.matchEnd ?? null,
    notes: entry.notes ?? null,
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

export function formatAssignmentTypeLabel(type: ShiftScheduleEntry["assignmentType"]) {
  return type === "pit" ? "Pit Form" : "Stand Form";
}

export function formatStandStationLabel(station: ShiftScheduleEntry["standStation"]) {
  if (!station) return "Stand Slot TBD";

  const alliance = station.startsWith("red") ? "Red" : "Blue";
  const position = station.slice(-1);
  return `${alliance} ${position}`;
}
