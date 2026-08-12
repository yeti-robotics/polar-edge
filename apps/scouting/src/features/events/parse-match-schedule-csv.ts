import nextErrorBrowserBinaryLoader from "next/dist/build/webpack/loaders/next-error-browser-binary-loader";
import {
  matchScheduleRowSchema,
  type MatchScheduleRow,
} from "./manual-import-schema";


const EXPECTED_HEADERS = [
  "match number",
  "r1",
  "r2",
  "r3",
  "b1",
  "b2",
  "b3",
] as const;


export function parseMatchScheduleCsv(csvText: string): MatchScheduleRow[] {

  const normalizedText = csvText.replace(/^\uFEFF/, "")
      .replace(/\r\n/g, "\n")
      .trim();

  const lines = normalizedText.split("\n");

  if (lines.length < 2) {
    throw new Error("CSV must have at least two lines");
  }


  const headerLine = lines[0];

  if(!headerLine) {
    throw new Error("The CSV Header line is missing");
  }


  const headers = headerLine.split(",").map((header) => header.trim());


  const headersAreValid = headers.length === EXPECTED_HEADERS.length && EXPECTED_HEADERS.every((expected, index) => headers[index] === expected);

  if(!headersAreValid) {
    throw new Error("The CSV Header line is missing or contains invalid headers");
  }

  const matchRows = lines.slice(1).map((line, index) => {
    const values = line.split(",").map((value) => value.trim());

    if (values.length !== EXPECTED_HEADERS.length) {
      throw new Error(`Line ${index + 2} has ${values.length} values, expected ${EXPECTED_HEADERS.length}`);
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
    })

    if (!result.success) {
      throw new Error(`Line ${index + 2} is invalid: ${result.error.message}`);
    }

    return result.data;
  })

  return matchRows;
}
