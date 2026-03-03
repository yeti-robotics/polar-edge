import { Injectable, Logger } from "@nestjs/common";
import { err, ok, type Result, ResultAsync } from "neverthrow";
import { SheetService } from "src/lib/sheet/sheet.service";
import { type ZodError } from "zod";
import { OUTREACH_SHEET_RANGE } from "./outreach.constants";
import { type OutreachRecord, OutreachRecordSchema } from "./outreach.schema";

@Injectable()
export class OutreachRepository {
  private readonly logger = new Logger(OutreachRepository.name);

  constructor(private readonly sheet: SheetService) {}

  private parseRow(row: unknown[]): Result<OutreachRecord, ZodError> {
    const result = OutreachRecordSchema.safeParse({
      date: row[0],
      userName: row[1],
      event: row[2],
      eventType: row[3],
      hours: row[4],
    });

    if (!result.success) return err(result.error);
    return ok(result.data);
  }

  /**
   * Returns all outreach records from the sheet
   *
   * Skips the header row and parses each row into an outreach record using Zod.
   * Returns an array of outreach records.
   *
   * **NOTE**: if the row is malformed, it will be skipped and a warning will be logged.
   *
   * @returns All outreach records
   */
  public findAll(): ResultAsync<OutreachRecord[], Error> {
    return this.sheet.get(OUTREACH_SHEET_RANGE).map((rows) =>
      rows.slice(1).flatMap((row) => {
        const result = this.parseRow(row);
        if (result.isErr()) {
          this.logger.warn(`Skipping malformed row: ${result.error.message}`);
          return [];
        }
        return [result.value];
      })
    );
  }

  /**
   * Returns all outreach records for a given user
   *
   * Skips the header row and parses each row into an outreach record using Zod.
   * Returns an array of outreach records for the user.
   *
   * **NOTE**: if the row is malformed, it will be skipped and a warning will be logged.
   *
   * @param userName The name of the user to find outreach records for
   * @returns All outreach records for the user
   */
  public findByUserName(userName: string): ResultAsync<OutreachRecord[], Error> {
    return this.findAll().map((records) => records.filter((r) => r.userName === userName));
  }
}
