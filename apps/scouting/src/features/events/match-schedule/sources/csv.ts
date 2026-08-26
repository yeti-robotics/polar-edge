import { parse } from "csv-parse/sync";
import { z } from "zod";
import type { MatchSchedule } from "../types";

const EXPECTED_HEADERS = ["match_number", "r1", "r2", "r3", "b1", "b2", "b3"] as const;

const sanitizeNumber = (val: unknown) => {
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (/^\d{1,3}(,\d{3})*$/.test(trimmed)) {
      return trimmed.replaceAll(",", "");
    }
    return trimmed;
  }
  return val;
};

const coercedInt = z.preprocess(sanitizeNumber, z.coerce.number().int().positive().max(2147483647));

export const matchScheduleRowSchema = z.object({
  match_number: coercedInt,
  r1: coercedInt,
  r2: coercedInt,
  r3: coercedInt,
  b1: coercedInt,
  b2: coercedInt,
  b3: coercedInt,
});

export function parseMatchScheduleCsv(csvText: string): Array<{
  matchNumber: number;
  r1: number;
  r2: number;
  r3: number;
  b1: number;
  b2: number;
  b3: number;
}> {
  let records: Record<string, unknown>[];
  try {
    records = parse(csvText, {
      columns: (headers) => {
        const receivedHeaders = headers.map((header) => header.trim());

        const headersAreValid =
          receivedHeaders.length === EXPECTED_HEADERS.length &&
          EXPECTED_HEADERS.every((expected, index) => receivedHeaders[index] === expected);

        if (!headersAreValid) {
          const expected = EXPECTED_HEADERS.join(", ");
          const received = receivedHeaders.join(", ");
          throw new Error(`The CSV header must be: ${expected}. Received: ${received}.`);
        }
        return receivedHeaders;
      },
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown";
    throw new Error(`CSV parsing failed: ${message}`);
  }

  if (records.length === 0) {
    throw new Error("CSV must have at least one data row");
  }

  const matchRows = records.map((record, index) => {
    const result = matchScheduleRowSchema.safeParse(record);

    if (!result.success) {
      throw new Error(`Line ${index + 2} is invalid: ${result.error.message}`);
    }

    const d = result.data;
    return {
      matchNumber: d.match_number,
      r1: d.r1,
      r2: d.r2,
      r3: d.r3,
      b1: d.b1,
      b2: d.b2,
      b3: d.b3,
    };
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

export function csvScheduleToImport(csvText: string): MatchSchedule {
  const rows = parseMatchScheduleCsv(csvText);

  return {
    matches: rows.map((row) => ({
      matchNumber: row.matchNumber,
      matchType: "qm",
      slots: [
        { teamNumber: row.r1, alliance: "red", position: 1 },
        { teamNumber: row.r2, alliance: "red", position: 2 },
        { teamNumber: row.r3, alliance: "red", position: 3 },
        { teamNumber: row.b1, alliance: "blue", position: 1 },
        { teamNumber: row.b2, alliance: "blue", position: 2 },
        { teamNumber: row.b3, alliance: "blue", position: 3 },
      ],
    })),
  };
}
