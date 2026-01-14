import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SheetService } from "src/sheet/sheet.service";
import { z } from "zod";
import {
  BOOLEAN_STRINGS,
  COLUMN_INDICES,
  COLUMN_NAMES,
  DEFAULT_LEADERBOARD_LIMIT,
  EXPIRED_SESSION_THRESHOLD_MS,
  FORGOT_SIGNOUT_CREDIT_MS,
  MS_PER_HOUR,
  SHEET_RANGE_APPEND,
  SHEET_RANGE_READ,
  STALE_SIGNIN_THRESHOLD_MS,
  TEAM_NAMES,
} from "./attendance.constants";
import { TwofaService } from "./twofa/twofa.service";

const AttendanceSchema = z.object({
  discordId: z.string(),
  team: z.string(),
  discordName: z.string(),
  date: z.string(),
  isSigningIn: z.boolean(),
});

type AttendanceRecord = z.infer<typeof AttendanceSchema>;

type AttendanceOperationResult =
  | {
      success: true;
      message?: string;
    }
  | {
      success: false;
      message: string;
    };

@Injectable()
export class AttendanceService {
  private readonly attendanceSheetId: string;
  private readonly twofaEnabled: boolean;
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private readonly sheetService: SheetService,
    private readonly configService: ConfigService,
    private readonly twofaService: TwofaService
  ) {
    const attendanceSheetId = this.configService.get<string>("ATTENDANCE_SPREADSHEET_ID");

    if (!attendanceSheetId) {
      throw new Error("ATTENDANCE_SPREADSHEET_ID is not set");
    }

    this.attendanceSheetId = attendanceSheetId;
    this.twofaEnabled = this.configService.get<boolean>("ATTENDANCE_2FA_ENABLED", false);
  }

  private getTeam(guildId: string) {
    switch (guildId) {
      case this.configService.get<string>("YETI_SERVER_ID"):
        return TEAM_NAMES.YETI_ROBOTICS;
      case this.configService.get<string>("DEV_GUILD_ID"):
        return TEAM_NAMES.DEV;
      default:
        return "";
    }
  }

  private async recordAttendance(
    discordId: string,
    discordName: string,
    guildId: string,
    operation: "signIn" | "signOut",
    date: Date = new Date()
  ): Promise<boolean> {
    const team = this.getTeam(guildId);

    const attendance = AttendanceSchema.parse({
      discordId,
      team,
      discordName,
      date: date.toISOString(),
      isSigningIn: operation === "signIn",
    });

    try {
      const result = await this.sheetService.appendSheetValues(
        this.attendanceSheetId,
        SHEET_RANGE_APPEND,
        [
          COLUMN_NAMES.map((value) =>
            attendance[value as keyof typeof attendance].toString()
          ),
        ]
      );

      if (result.updates?.updatedRows && result.updates.updatedRows >= 1) {
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to perform attendance operation: ${error}`);
      return false;
    }
  }

  public async getAttendance(discordId: string): Promise<AttendanceRecord[]> {
    const attendance = await this.sheetService.getSheetValues(
      this.attendanceSheetId,
      SHEET_RANGE_READ
    );

    if (!attendance) {
      return [];
    }

    const userAttendance = attendance.filter((row) => row[COLUMN_INDICES.DISCORD_ID] === discordId);

    return userAttendance.map((row) => {
      return AttendanceSchema.parse({
        discordId: row[COLUMN_INDICES.DISCORD_ID],
        team: row[COLUMN_INDICES.TEAM],
        discordName: row[COLUMN_INDICES.DISCORD_NAME],
        date: row[COLUMN_INDICES.DATE],
        isSigningIn:
          row[COLUMN_INDICES.IS_SIGNING_IN] === BOOLEAN_STRINGS.TRUE ||
          row[COLUMN_INDICES.IS_SIGNING_IN] === BOOLEAN_STRINGS.TRUE_UPPERCASE,
      });
    });
  }

  private async getLastAttendanceRecord(discordId: string): Promise<AttendanceRecord | undefined> {
    const attendance = await this.getAttendance(discordId);
    return attendance.at(-1);
  }

  private validateTwofaCode(code?: number): AttendanceOperationResult | null {
    if (!this.twofaEnabled) {
      return null;
    }

    if (typeof code !== "number") {
      return {
        success: false,
        message: "A code is required to sign in/out.",
      };
    }

    if (!this.twofaService.verifyCode(code)) {
      return {
        success: false,
        message: "Invalid code.",
      };
    }

    return null;
  }

  private isStaleSession(lastSignIn: Date): boolean {
    return Date.now() - lastSignIn.getTime() > STALE_SIGNIN_THRESHOLD_MS;
  }

  private async handleForgotToSignOut(
    discordId: string,
    discordName: string,
    guildId: string,
    lastSignInDate: Date
  ): Promise<AttendanceOperationResult> {
    const creditTime = new Date(lastSignInDate.getTime() + FORGOT_SIGNOUT_CREDIT_MS);
    const signOutResult = await this.recordAttendance(
      discordId,
      discordName,
      guildId,
      "signOut",
      creditTime
    );
    const signInResult = await this.recordAttendance(discordId, discordName, guildId, "signIn");

    if (signOutResult && signInResult) {
      return {
        success: true,
        message:
          "You signed in last meeting but did not sign out. You were credited with 1.5 hours of attendance for that meeting. You are now signed in.",
      };
    }
    return { success: false, message: "Failed to sign in" };
  }

  private async recordSignIn(
    discordId: string,
    discordName: string,
    guildId: string
  ): Promise<AttendanceOperationResult> {
    try {
      const success = await this.recordAttendance(discordId, discordName, guildId, "signIn");
      if (success) {
        return { success: true };
      }
      return { success: false, message: "Failed to sign in." };
    } catch (error) {
      this.logger.error(`Failed to sign in: ${error}`);
      return { success: false, message: "Failed to sign in." };
    }
  }

  private async recordSignOut(
    discordId: string,
    discordName: string,
    guildId: string
  ): Promise<AttendanceOperationResult> {
    try {
      const success = await this.recordAttendance(discordId, discordName, guildId, "signOut");
      if (success) {
        return { success: true };
      }
      return { success: false, message: "Failed to sign out." };
    } catch (error) {
      this.logger.error(`Failed to sign out: ${error}`);
      return { success: false, message: "Failed to sign out." };
    }
  }

  public async signIn(
    discordId: string,
    guildId: string,
    discordName: string,
    code?: number
  ): Promise<AttendanceOperationResult> {
    const codeError = this.validateTwofaCode(code);
    if (codeError) {
      return codeError;
    }

    const lastOperation = await this.getLastAttendanceRecord(discordId);

    // Not currently signed in - simple sign in
    if (!lastOperation?.isSigningIn) {
      return this.recordSignIn(discordId, discordName, guildId);
    }

    // Already signed in - check if session is stale
    const lastDate = new Date(lastOperation.date);
    if (this.isStaleSession(lastDate)) {
      return this.handleForgotToSignOut(discordId, discordName, guildId, lastDate);
    }

    return { success: false, message: "You are currently signed in." };
  }

  public async signOut(
    discordId: string,
    guildId: string,
    discordName: string,
    code?: number
  ): Promise<AttendanceOperationResult> {
    const codeError = this.validateTwofaCode(code);
    if (codeError) {
      return codeError;
    }

    const lastOperation = await this.getLastAttendanceRecord(discordId);

    if (!lastOperation?.isSigningIn) {
      return {
        success: false,
        message: "You are not signed in.",
      };
    }

    // If session expired, treat as new sign-in
    const lastDate = new Date(lastOperation.date);
    if (Date.now() - lastDate.getTime() > EXPIRED_SESSION_THRESHOLD_MS) {
      return this.signIn(discordId, guildId, discordName, code);
    }

    return this.recordSignOut(discordId, discordName, guildId);
  }

  private calculateHoursFromRecords(records: AttendanceRecord[]): number {
    let hours = 0;
    let lastSignIn: Date | null = null;

    for (const record of records) {
      if (record.isSigningIn) {
        lastSignIn = new Date(record.date);
      } else if (lastSignIn) {
        hours += (new Date(record.date).getTime() - lastSignIn.getTime()) / MS_PER_HOUR;
        lastSignIn = null;
      } else {
        throw new Error("Invalid attendance record");
      }
    }

    return hours;
  }

  public async getUserHours(discordId: string): Promise<number> {
    const attendance = await this.getAttendance(discordId);
    return this.calculateHoursFromRecords(attendance);
  }

  public async getTopMembersByHours(limit: number = DEFAULT_LEADERBOARD_LIMIT) {
    try {
      const allAttendance = await this.sheetService.getSheetValues(
        this.attendanceSheetId,
        SHEET_RANGE_READ
      );

      if (!allAttendance?.length) return [];

      // Map of discordId -> { userName, records }
      const userRecords = new Map<string, { userName: string; records: AttendanceRecord[] }>();

      // Process each record (skip header row)
      for (let i = 1; i < allAttendance.length; i++) {
        const row = allAttendance[i];
        if (!row?.[COLUMN_INDICES.IS_SIGNING_IN]) continue;

        const discordId = String(row[COLUMN_INDICES.DISCORD_ID]);
        const discordName = String(row[COLUMN_INDICES.DISCORD_NAME]);

        // Initialize user data if it doesn't exist
        if (!userRecords.has(discordId)) {
          userRecords.set(discordId, {
            userName: discordName,
            records: [],
          });
        }

        const record = AttendanceSchema.parse({
          discordId: row[COLUMN_INDICES.DISCORD_ID],
          team: row[COLUMN_INDICES.TEAM],
          discordName: row[COLUMN_INDICES.DISCORD_NAME],
          date: row[COLUMN_INDICES.DATE],
          isSigningIn:
            row[COLUMN_INDICES.IS_SIGNING_IN] === BOOLEAN_STRINGS.TRUE ||
            row[COLUMN_INDICES.IS_SIGNING_IN] === BOOLEAN_STRINGS.TRUE_UPPERCASE,
        });

        userRecords.get(discordId)!.records.push(record);
      }

      // Calculate hours for each user and convert to array
      const usersWithHours = Array.from(userRecords.entries())
        .map(([discordId, { userName, records }]) => ({
          userName,
          totalHours: this.calculateHoursFromRecords(records),
        }))
        .filter((user) => user.totalHours > 0)
        .sort((a, b) => b.totalHours - a.totalHours)
        .slice(0, limit)
        .map(({ userName, totalHours }) => ({
          userName,
          totalHours: parseFloat(totalHours.toFixed(2)),
        }));

      return usersWithHours;
    } catch (error) {
      this.logger.error(`Error getting attendance leaderboard:`, error);
      return [];
    }
  }
}
