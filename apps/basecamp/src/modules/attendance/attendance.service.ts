import { Injectable, Logger } from "@nestjs/common";
import {
  err,
  errAsync,
  fromThrowable,
  ok,
  okAsync,
  type Result,
  type ResultAsync,
} from "neverthrow";
import { AppConfigService } from "src/config/config.service";
import {
  DEFAULT_LEADERBOARD_LIMIT,
  EXPIRED_SESSION_THRESHOLD_MS,
  FORGOT_SIGNOUT_CREDIT_MS,
  MS_PER_HOUR,
  STALE_SIGNIN_MIN_HOURS_MS,
  TEAM_NAMES,
} from "./attendance.constants";
import { AttendanceRepository } from "./attendance.repository";
import { type AttendanceRecord } from "./attendance.schema";
import { getTotalPossibleHoursToDate } from "./schedule.util";
import { TwofaService } from "./twofa/twofa.service";

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
  private readonly twofaEnabled: boolean;
  private readonly logger = new Logger(AttendanceService.name);

  private readonly yetiServerId: string;
  private readonly devGuildId: string;

  constructor(
    private readonly repository: AttendanceRepository,
    private readonly configService: AppConfigService,
    private readonly twofaService: TwofaService
  ) {
    this.twofaEnabled = this.configService.get("attendance2faEnabled");
    this.yetiServerId = this.configService.get("yetiServerId");
    this.devGuildId = this.configService.get("devGuildId") ?? "";
  }

  private getTeam(guildId: string) {
    switch (guildId) {
      case this.yetiServerId:
        return TEAM_NAMES.YETI_ROBOTICS;
      case this.devGuildId:
        return TEAM_NAMES.DEV;
      default:
        return "";
    }
  }

  private recordAttendance(
    discordId: string,
    discordName: string,
    guildId: string,
    operation: "signIn" | "signOut",
    date: Date = new Date()
  ): ResultAsync<void, Error> {
    return this.repository
      .append({
        discordId,
        team: this.getTeam(guildId),
        discordName,
        date: date.toISOString(),
        isSigningIn: operation === "signIn",
      })
      .mapErr((error) => {
        this.logger.error(`Failed to record attendance: ${error.message}`);
        return error;
      });
  }

  public getAttendance(discordId: string): ResultAsync<AttendanceRecord[], Error> {
    return this.repository.findByDiscordId(discordId);
  }

  private getLastAttendanceRecord(
    discordId: string
  ): ResultAsync<AttendanceRecord | undefined, Error> {
    return this.getAttendance(discordId).map((records) => records.at(-1));
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

  private isStaleSession(signInTime: Date): Result<boolean, Error> {
    const toEasternYMD = fromThrowable(
      (date: Date) => {
        const parts = new Intl.DateTimeFormat("en-US", {
          timeZone: "America/New_York",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).formatToParts(date);
        const getPart = (type: "year" | "month" | "day") => {
          const part = parts.find((p) => p.type === type);
          if (part == null) throw new Error(`Missing ${type} in date parts`);
          return Number(part.value);
        };
        return { year: getPart("year"), month: getPart("month"), day: getPart("day") };
      },
      (e) => (e instanceof Error ? e : new Error(String(e)))
    );

    const now = new Date();
    const signInResult = toEasternYMD(signInTime);
    if (signInResult.isErr()) return err(signInResult.error);
    const nowResult = toEasternYMD(now);
    if (nowResult.isErr()) return err(nowResult.error);

    const signInEastern = signInResult.value;
    const nowEastern = nowResult.value;

    const differentDay =
      nowEastern.year !== signInEastern.year ||
      nowEastern.month !== signInEastern.month ||
      nowEastern.day !== signInEastern.day;
    const enoughTimeElapsed = now.getTime() - signInTime.getTime() > STALE_SIGNIN_MIN_HOURS_MS;
    return ok(differentDay && enoughTimeElapsed);
  }

  private handleForgotToSignOut(
    discordId: string,
    discordName: string,
    guildId: string,
    lastSignInDate: Date
  ): ResultAsync<AttendanceOperationResult, Error> {
    const creditTime = new Date(lastSignInDate.getTime() + FORGOT_SIGNOUT_CREDIT_MS);
    return this.recordAttendance(discordId, discordName, guildId, "signOut", creditTime)
      .andThen(() => this.recordAttendance(discordId, discordName, guildId, "signIn"))
      .map(
        (): AttendanceOperationResult => ({
          success: true,
          message:
            "You signed in last meeting but did not sign out. You were credited with 1.5 hours of attendance for that meeting. You are now signed in.",
        })
      )
      .orElse(
        (): ResultAsync<AttendanceOperationResult, never> =>
          okAsync({
            success: false,
            message: "Failed to sign in. Please try again or let a mentor know.",
          })
      );
  }

  private recordSignIn(
    discordId: string,
    discordName: string,
    guildId: string
  ): ResultAsync<AttendanceOperationResult, Error> {
    return this.recordAttendance(discordId, discordName, guildId, "signIn")
      .map((): AttendanceOperationResult => ({ success: true }))
      .orElse((error): ResultAsync<AttendanceOperationResult, never> => {
        this.logger.error(`Failed to sign in: ${error}`);
        return okAsync({
          success: false,
          message: "Failed to sign in. Please try again or let a mentor know.",
        });
      });
  }

  private recordSignOut(
    discordId: string,
    discordName: string,
    guildId: string
  ): ResultAsync<AttendanceOperationResult, Error> {
    return this.recordAttendance(discordId, discordName, guildId, "signOut")
      .map((): AttendanceOperationResult => ({ success: true }))
      .orElse((error): ResultAsync<AttendanceOperationResult, never> => {
        this.logger.error(`Failed to sign out: ${error}`);
        return okAsync({
          success: false,
          message: "Failed to sign out. Please try again or let a mentor know.",
        });
      });
  }

  public signIn(
    discordId: string,
    guildId: string,
    discordName: string,
    code?: number,
    skipTwofa?: boolean
  ): ResultAsync<AttendanceOperationResult, Error> {
    if (!skipTwofa) {
      const codeError = this.validateTwofaCode(code);
      if (codeError) {
        return okAsync(codeError);
      }
    }

    return this.getLastAttendanceRecord(discordId).andThen((lastOperation) => {
      if (!lastOperation?.isSigningIn) {
        return this.recordSignIn(discordId, discordName, guildId);
      }

      const lastDate = new Date(lastOperation.date);
      const staleResult = this.isStaleSession(lastDate);
      if (staleResult.isErr()) return errAsync(staleResult.error);
      if (staleResult.value) {
        return this.handleForgotToSignOut(discordId, discordName, guildId, lastDate);
      }

      return okAsync<AttendanceOperationResult, Error>({
        success: false,
        message: "You are currently signed in.",
      });
    });
  }

  public signOut(
    discordId: string,
    guildId: string,
    discordName: string,
    code?: number,
    skipTwofa?: boolean
  ): ResultAsync<AttendanceOperationResult, Error> {
    if (!skipTwofa) {
      const codeError = this.validateTwofaCode(code);
      if (codeError) {
        return okAsync(codeError);
      }
    }

    return this.getLastAttendanceRecord(discordId).andThen((lastOperation) => {
      if (!lastOperation?.isSigningIn) {
        return okAsync<AttendanceOperationResult, Error>({
          success: false,
          message: "You are not signed in.",
        });
      }

      const lastDate = new Date(lastOperation.date);
      if (!skipTwofa && Date.now() - lastDate.getTime() > EXPIRED_SESSION_THRESHOLD_MS) {
        return this.signIn(discordId, guildId, discordName, code, skipTwofa);
      }

      return this.recordSignOut(discordId, discordName, guildId);
    });
  }

  private calculateHoursFromRecords(records: AttendanceRecord[]): Result<number, Error> {
    let hours = 0;
    let lastSignIn: Date | null = null;

    for (const record of records) {
      if (record.isSigningIn) {
        lastSignIn = new Date(record.date);
      } else if (lastSignIn) {
        hours += (new Date(record.date).getTime() - lastSignIn.getTime()) / MS_PER_HOUR;
        lastSignIn = null;
      } else {
        return err(
          new Error(
            `Data integrity error: sign-out record found without preceding sign-in record. Timestamp: ${record.date}`
          )
        );
      }
    }

    return ok(hours);
  }

  public getUserHours(discordId: string): ResultAsync<number, Error> {
    return this.getAttendance(discordId).andThen((records) =>
      this.calculateHoursFromRecords(records)
    );
  }

  public getTotalPossibleHoursToDate(asOfDate?: Date): number {
    return getTotalPossibleHoursToDate(asOfDate);
  }

  private getAllMembersSortedByHours(): ResultAsync<
    Array<{ discordId: string; userName: string; totalHours: number }>,
    Error
  > {
    return this.repository.findAll().andThen((records) => {
      const userRecords = new Map<string, { userName: string; records: AttendanceRecord[] }>();

      for (const record of records) {
        let userData = userRecords.get(record.discordId);
        if (!userData) {
          userData = { userName: record.discordName, records: [] };
          userRecords.set(record.discordId, userData);
        }
        userData.records.push(record);
      }

      const entries: Array<{ discordId: string; userName: string; totalHours: number }> = [];
      for (const [id, { userName, records: userRecs }] of userRecords.entries()) {
        const hoursResult = this.calculateHoursFromRecords(userRecs);
        if (hoursResult.isErr()) return errAsync(hoursResult.error);
        entries.push({ discordId: id, userName, totalHours: hoursResult.value });
      }

      return okAsync(
        entries.filter((u) => u.totalHours > 0).sort((a, b) => b.totalHours - a.totalHours)
      );
    });
  }

  public getTopMembersByHours(
    limit: number = DEFAULT_LEADERBOARD_LIMIT
  ): ResultAsync<Array<{ userName: string; totalHours: number }>, Error> {
    return this.getAllMembersSortedByHours().map((sorted) =>
      sorted.slice(0, limit).map(({ userName, totalHours }) => ({
        userName,
        totalHours: parseFloat(totalHours.toFixed(2)),
      }))
    );
  }

  public getUserRank(discordId: string): ResultAsync<number | null, Error> {
    return this.getAllMembersSortedByHours().map((sorted) => {
      const userEntry = sorted.find((u) => u.discordId === discordId);
      if (!userEntry) return null;
      const distinctHigher = new Set(
        sorted.filter((u) => u.totalHours > userEntry.totalHours).map((u) => u.totalHours)
      );
      return distinctHigher.size + 1;
    });
  }
}
