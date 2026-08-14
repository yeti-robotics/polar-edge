import { z } from "zod";
import type { EventTarget, MatchSchedule } from "../types";
import { vTeamMatchConsensus } from "@/lib/database/schema";
import { allianceEnum } from "@/lib/database/schema/types";


export const matchScheduleRowSchema = z.object({
  matchNumber: z.coerce.number().int().positive(),
  r1: z.coerce.number().int().positive(),
  r2: z.coerce.number().int().positive(),
  r3: z.coerce.number().int().positive(),
  b1: z.coerce.number().int().positive(),
  b2: z.coerce.number().int().positive(),
  b3: z.coerce.number().int().positive(),
});

export type MatchScheduleRow = z.infer<typeof matchScheduleRowSchema>;


const EXPECTED_HEADERS = ["match_number", "r1", "r2", "r3", "b1", "b2", "b3"] as const;

export function parseMatchScheduleCsv(csvText: string): MatchScheduleRow[] {
  const normalizedText = csvText
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .trim();

  const lines = normalizedText.split("\n");

  if (lines.length < 2) {
    throw new Error("CSV must have at least two lines");
  }

  const headerLine = lines[0];

  if (!headerLine) {
    throw new Error("The CSV Header line is missing");
  }

  const headers = headerLine.split(",").map((header) => header.trim());

  const headersAreValid =
    headers.length === EXPECTED_HEADERS.length &&
    EXPECTED_HEADERS.every((expected, index) => headers[index] === expected);

  if (!headersAreValid) {
    throw new Error("The CSV Header Line is missing or contains invalid headers");
  }

  const matchRows = lines.slice(1).map((line, index) => {
    const values = line.split(",").map((value) => value.trim());

    if (values.length !== EXPECTED_HEADERS.length) {
      throw new Error(
        `Line ${index + 2} has ${values.length} values, expected ${EXPECTED_HEADERS.length}`
      );
    }

    const [matchNumber, r1, r2, r3, b1, b2, b3] = values;

    const result = matchScheduleRowSchema.safeParse({
      matchNumber,
      r1,
      r2,
      r3,
      b1,
      b2,
      b3,
    });

    if (!result.success) {
      throw new Error(`Line ${index + 2} is invalid: ${result.error.message}`);
    }

    return result.data;
  });

  const seenMatchNumbers = new Set<number>();

  for (const row of matchRows) {
    if (seenMatchNumbers.has(row.matchNumber)) {
      throw new Error(`Duplicate match number: ${row.matchNumber}`);
    }
    seenMatchNumbers.add(row.matchNumber);

    const teams = [row.r1, row.r2, row.r3, row.b1, row.b2, row.b3];
    const uniqueTeams = new Set(teams);

    if (uniqueTeams.size !== teams.length) {
      throw new Error(`Match ${row.matchNumber} contains a duplicate team`);
    }
  }

  return matchRows;
}

type CreateableEventTarget = Extract<EventTarget, {
  mode: "create-or-update"
}>;

export function csvScheduleToImport(
  event: CreateableEventTarget,
  csvText: string,
): MatchSchedule {

  const rows = parseMatchScheduleCsv(csvText);

  return {
    event,
    matches: rows.map((row) => ({
      matchNumber: row.matchNumber,
      matchType: "qm",

      slots: [
        {
          teamNumber: row.r1,
          alliance: "red",
          position: 1,


        },
        {
          teamNumber: row.r2,
          alliance: "red",
          position: 2,
        },
        {
          teamNumber: row.r3,
          alliance: "red",
          position: 3,
        },

        {
          teamNumber: row.b1,
          alliance: "blue",
          position: 1,
        },
        {
          teamNumber: row.b2,
          alliance: "blue",
          position: 2,
        },
        {
          teamNumber: row.b3,
          alliance: "blue",
          position: 3,
        },

      ]
    }))
  }


}
