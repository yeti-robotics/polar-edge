import { Injectable, Logger } from "@nestjs/common";
import { err, ok, Result, ResultAsync } from "neverthrow";
import { SheetService } from "src/lib/sheet/sheet.service";
import { ZodError } from "zod";
import { COLUMN_INDICES, SHEET_RANGE_APPEND, SHEET_RANGE_READ } from "./attendance.constants";
import { type AttendanceRecord, AttendanceRecordSchema } from "./attendance.schema";

@Injectable()
export class AttendanceRepository {
  private readonly logger = new Logger(AttendanceRepository.name);

  constructor(private readonly sheet: SheetService) {}

  private parseRow(row: unknown[]): Result<AttendanceRecord, ZodError> {
    const result = AttendanceRecordSchema.safeParse({
      discordId: row[COLUMN_INDICES.DISCORD_ID],
      team: row[COLUMN_INDICES.TEAM],
      discordName: row[COLUMN_INDICES.DISCORD_NAME],
      date: row[COLUMN_INDICES.DATE],
      isSigningIn: row[COLUMN_INDICES.IS_SIGNING_IN],
    });

    if (!result.success) return err(result.error);
    return ok(result.data);
  }

  public findByDiscordId(discordId: string): ResultAsync<AttendanceRecord[], Error> {
    return this.sheet.get(SHEET_RANGE_READ).map((rows) =>
      rows
        .slice(1)
        .filter((row) => row[COLUMN_INDICES.DISCORD_ID] === discordId)
        .flatMap((row) => {
          const result = this.parseRow(row);
          if (result.isErr()) {
            this.logger.warn(`Skipping malformed row: ${result.error.message}`);
            return [];
          }
          return [result.value];
        })
    );
  }

  public findAll(): ResultAsync<AttendanceRecord[], Error> {
    return this.sheet.get(SHEET_RANGE_READ).map((rows) =>
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

  public append(record: AttendanceRecord): ResultAsync<void, Error> {
    return this.sheet.append(SHEET_RANGE_APPEND, [
      [
        record.discordId,
        record.team,
        record.discordName,
        record.date,
        record.isSigningIn.toString(),
      ],
    ]);
  }
}
