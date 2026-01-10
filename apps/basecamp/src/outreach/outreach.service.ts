import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SheetService } from "src/sheet/sheet.service";
import { z } from "zod";

const OutreachColumnSchema = z.object({
  date: z.string(),
  userName: z.string(),
  event: z.string(),
  eventType: z.string(),
  hours: z.number(),
});

@Injectable()
export class OutreachService {
  private readonly outreachSheetId: string;

  constructor(
    private readonly sheetService: SheetService,
    private readonly configService: ConfigService
  ) {
    const outreachSheetId = this.configService.get<string>("OUTREACH_SPREADSHEET_ID");

    if (!outreachSheetId) {
      throw new Error("OUTREACH_SPREADSHEET_ID is not set");
    }

    this.outreachSheetId = outreachSheetId;
  }

  async getUserOutreach(userName: string) {
    try {
      const sheet = await this.sheetService.getSheetValues(
        this.outreachSheetId,
        "OutreachInput!A:E"
      );

      if (!sheet) {
        return null;
      }

      const userOutreach = sheet.filter((row) => row[1] === userName);

      return userOutreach.map((row) =>
        OutreachColumnSchema.parse({
          date: row[0],
          userName: row[1],
          event: row[2],
          eventType: row[3],
          hours: Number(row[4]),
        })
      );
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  private async parseAllOutreachData() {
    try {
      const sheet = await this.sheetService.getSheetValues(
        this.outreachSheetId,
        "OutreachInput!A:E"
      );

      if (!sheet) {
        return [];
      }

      // Parse all outreach data
      const outreachData = sheet.slice(1).map((row) =>
        OutreachColumnSchema.parse({
          date: row[0],
          userName: row[1],
          event: row[2],
          eventType: row[3],
          hours: Number(row[4]),
        })
      );

      return outreachData;
    } catch (error) {
      console.error("Error parsing outreach data:", error);
      return [];
    }
  }

  async getTotalTeamOutreachHours() {
    try {
      const outreachData = await this.parseAllOutreachData();

      // Sum all hours across all users
      const totalHours = outreachData.reduce((sum, entry) => sum + entry.hours, 0);

      return Math.round(totalHours * 100) / 100;
    } catch (error) {
      console.error("Error getting total team outreach hours:", error);
      return 0;
    }
  }

  async getTopMembersByHours(limit: number = 5) {
    try {
      const outreachData = await this.parseAllOutreachData();

      if (outreachData.length === 0) {
        return [];
      }

      // Group by user and sum hours
      const userHoursMap = new Map<string, number>();

      outreachData.forEach((entry) => {
        const currentHours = userHoursMap.get(entry.userName) || 0;
        userHoursMap.set(entry.userName, currentHours + entry.hours);
      });

      // Convert to array and sort by total hours (descending)
      const leaderboard = Array.from(userHoursMap.entries())
        .map(([userName, totalHours]) => ({ userName, totalHours }))
        .sort((a, b) => b.totalHours - a.totalHours)
        .slice(0, limit);

      return leaderboard;
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      return [];
    }
  }
}
