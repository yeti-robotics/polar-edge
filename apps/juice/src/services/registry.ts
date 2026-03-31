import { DSLogParser } from "./dslog";
import type { AbstractLogParser, ParsedRecord } from "./parser";

const parsers: AbstractLogParser<ParsedRecord>[] = [new DSLogParser()];

/** All file extensions accepted across all registered parsers */
export const acceptedExtensions = parsers.flatMap((p) => p.extensions);

/** Find the parser that handles a given file name, or null */
export function getParserForFile(fileName: string): AbstractLogParser<ParsedRecord> | null {
  return parsers.find((p) => p.supports(fileName)) ?? null;
}
