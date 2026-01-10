import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SheetService } from "src/sheet/sheet.service";
import { z } from "zod";
import { AttendanceTwoFAService } from "./attendance-twofa/attendance-twofa.service";

const AttendanceSchema = z.object({
  discordId: z.string(),
  team: z.string(),
  discordName: z.string(),
  date: z.string(),
  isSigningIn: z.boolean(),
});

type AttendanceOperationResult =
  | {
      success: true;
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
    private readonly attendanceTwofaService: AttendanceTwoFAService
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
        return "YETI Robotics";
      case this.configService.get<string>("DEV_GUILD_ID"):
        return "Dev";
      default:
        return "";
    }
  }

  private async performAttendanceOperation(
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
        "Attendance!A:D",
        [
          ["discordId", "team", "discordName", "date", "isSigningIn"].map((value) =>
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

  public async getAttendance(discordId: string): Promise<z.infer<typeof AttendanceSchema>[]> {
    const attendance = await this.sheetService.getSheetValues(
      this.attendanceSheetId,
      `Attendance!A:E`
    );

    if (!attendance) {
      return [];
    }

    const userAttendance = attendance.filter((row) => row[0] === discordId);

    return userAttendance.map((row) => {
      return AttendanceSchema.parse({
        discordId: row[0],
        team: row[1],
        discordName: row[2],
        date: row[3],
        isSigningIn: row[4] === "true" || row[4] === "TRUE",
      });
    });
  }

  private validateAttendanceCode(code?: number) {
    if (!this.twofaEnabled) {
      return null;
    }

    if (typeof code !== "number") {
      return {
        success: false,
        message: "A code is required to sign in/out.",
      };
    }

    const isCodeValid = this.attendanceTwofaService.verifyCode(code);

    if (!isCodeValid) {
      return {
        success: false,
        message: "Invalid code.",
      };
    }

    return null;
  }

  public async signIn(
    discordId: string,
    guildId: string,
    discordName: string,
    code?: number
  ): Promise<AttendanceOperationResult> {
    const codeValidationError = this.validateAttendanceCode(code);
    if (codeValidationError) {
      return codeValidationError;
    }

    const existingAttendance = await this.getAttendance(discordId);

    const lastOperation = existingAttendance.at(-1);

    if (lastOperation?.isSigningIn) {
      const lastDate = new Date(lastOperation.date);
      const currentDate = new Date();

      if (currentDate.getTime() - lastDate.getTime() < 1000 * 60 * 60 * 3.5) {
        return {
          success: false,
          message: "You are currently signed in.",
        };
      } else {
        try {
          const halfCreditResult = await this.performAttendanceOperation(
            discordId,
            discordName,
            guildId,
            "signOut",
            new Date(lastDate.getTime() + 1000 * 60 * 60 * 1.5)
          );
          const newSigninResult = await this.performAttendanceOperation(
            discordId,
            discordName,
            guildId,
            "signIn"
          );

          if (halfCreditResult && newSigninResult) {
            return {
              success: false,
              message:
                "You signed in last meeting but did not sign out. You will be credited for 1.5 hours of attendance for that meeting. You are now signed in.",
            };
          } else {
            return {
              success: false,
              message: "Failed to sign in",
            };
          }
        } catch (error) {
          this.logger.error(`Failed to sign in: ${error}`);
          return {
            success: false,
            message: "Failed to sign in.",
          };
        }
      }
    }

    try {
      await this.performAttendanceOperation(discordId, discordName, guildId, "signIn");
      return {
        success: true,
      };
    } catch (error) {
      this.logger.error(`Failed to sign in: ${error}`);
      return {
        success: false,
        message: "Failed to sign in.",
      };
    }
  }

  public async signOut(
    discordId: string,
    guildId: string,
    discordName: string,
    code?: number
  ): Promise<AttendanceOperationResult> {
    const codeValidationError = this.validateAttendanceCode(code);
    if (codeValidationError) {
      return codeValidationError;
    }

    const existingAttendance = await this.getAttendance(discordId);

    const lastOperation = existingAttendance.at(-1);

    if (!lastOperation?.isSigningIn) {
      return {
        success: false,
        message: "You are not signed in.",
      };
    } else if (Date.now() - new Date(lastOperation.date).getTime() > 1000 * 60 * 60 * 18) {
      return this.signIn(discordId, guildId, discordName, code);
    }

    try {
      await this.performAttendanceOperation(discordId, discordName, guildId, "signOut");
      return {
        success: true,
      };
    } catch (error) {
      this.logger.error(`Failed to sign out: ${error}`);
      return {
        success: false,
        message: "Failed to sign out.",
      };
    }
  }

  public async getUserHours(discordId: string): Promise<number> {
    const attendance = await this.getAttendance(discordId);

    let hours = 0;
    let lastSignIn: Date | null = null;
    for (const attendanceRecord of attendance) {
      const isSigningIn = attendanceRecord.isSigningIn;
      const date = new Date(attendanceRecord.date);

      if (isSigningIn) {
        lastSignIn = date;
      } else if (lastSignIn) {
        hours += (date.getTime() - lastSignIn.getTime()) / (1000 * 60 * 60);
        lastSignIn = null;
      } else {
        throw new Error("Invalid attendance record");
      }
    }

    return hours;
  }

  public async getTopMembersByHours(limit: number = 5) {
    try {
      const allAttendance = await this.sheetService.getSheetValues(
        this.attendanceSheetId,
        "Attendance!A:E"
      );

      if (!allAttendance?.length) return [];

      // Map of discordId -> { userName, hourTotal }
      const userData = new Map<string, { userName: string; hourTotal: number }>();
      // Map of discordId -> lastSignInTime
      const lastSignIn = new Map<string, Date>();

      // Process each record (skip header row)
      for (let i = 1; i < allAttendance.length; i++) {
        const row = allAttendance[i];
        if (!row?.[4]) continue;

        const discordId = String(row[0]);
        const discordName = String(row[2]);
        const timestamp = new Date(String(row[3]));
        const isSignIn = row[4] === "true" || row[4] === "TRUE";

        // Initialize user data if it doesn't exist
        if (!userData.has(discordId)) {
          userData.set(discordId, {
            userName: discordName,
            hourTotal: 0,
          });
        }

        if (isSignIn) {
          lastSignIn.set(discordId, timestamp);
        } else if (lastSignIn.has(discordId)) {
          const user = userData.get(discordId);
          const signInTime = lastSignIn.get(discordId);
          if (!user || !signInTime) {
            throw new Error("Invalid attendance record");
          }
          const hours = (timestamp.getTime() - signInTime.getTime()) / 3.6e6;
          if (hours > 0) user.hourTotal += hours;
          lastSignIn.delete(discordId);
        }
      }

      // Convert to array, sort, and limit results
      return Array.from(userData.values())
        .filter((user) => user.hourTotal > 0)
        .sort((a, b) => b.hourTotal - a.hourTotal)
        .slice(0, limit)
        .map(({ userName, hourTotal: totalHours }) => ({
          userName,
          totalHours: parseFloat(totalHours.toFixed(2)),
        }));
    } catch (error) {
      this.logger.error(`Error getting attendance leaderboard:`, error);
      return [];
    }
  }
}
