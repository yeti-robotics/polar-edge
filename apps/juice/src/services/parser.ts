/** Minimum contract for any parsed record */
export interface ParsedRecord {
  timestamp: number;
  [key: string]: unknown;
}

export interface ParseResult<T extends ParsedRecord = ParsedRecord> {
  records: T[];
  startTime: number;
  endTime: number;
}

export abstract class AbstractLogParser<T extends ParsedRecord = ParsedRecord> {
  /** File extensions this parser handles (e.g. [".dslog"]) */
  abstract readonly extensions: string[];

  /** Identifier for this log type — used as the store name and logType discriminator */
  abstract readonly logType: string;

  /** Parse a raw file buffer into typed records */
  abstract parse(buffer: ArrayBuffer): ParseResult<T>;

  supports(fileName: string): boolean {
    return this.extensions.some((ext) => fileName.endsWith(ext));
  }
}
