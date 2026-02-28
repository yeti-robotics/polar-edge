import { Injectable } from "@nestjs/common";
import { SheetService } from "src/lib/sheet/sheet.service";
import { roundToTenth } from "src/lib/utils/math.utils";
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
  constructor(private readonly sheetService: SheetService) {}

  async getUserOutreach(userName: string) {
    const result = await this.sheetService.get("OutreachInput!A:E");

    if (result.isErr()) return null;

    return result.value
      .filter((row) => row[1] === userName)
      .map((row) =>
        OutreachColumnSchema.parse({
          date: row[0],
          userName: row[1],
          event: row[2],
          eventType: row[3],
          hours: Number(row[4]),
        })
      );
  }

  private async parseAllOutreachData() {
    const result = await this.sheetService.get("OutreachInput!A:E");

    if (result.isErr()) return [];

    return result.value.slice(1).map((row) =>
      OutreachColumnSchema.parse({
        date: row[0],
        userName: row[1],
        event: row[2],
        eventType: row[3],
        hours: Number(row[4]),
      })
    );
  }

  async getTotalTeamOutreachHours() {
    try {
      const outreachData = await this.parseAllOutreachData();
      const totalHours = outreachData.reduce((sum, entry) => sum + entry.hours, 0);
      return Math.round(totalHours * 100) / 100;
    } catch (error) {
      console.error("Error getting total team outreach hours:", error);
      return 0;
    }
  }

  async getTopMembersByHours(limit = 5) {
    try {
      const outreachData = await this.parseAllOutreachData();

      if (outreachData.length === 0) return [];

      const userHoursMap = new Map<string, number>();
      for (const entry of outreachData) {
        userHoursMap.set(entry.userName, (userHoursMap.get(entry.userName) ?? 0) + entry.hours);
      }

      return Array.from(userHoursMap.entries())
        .map(([userName, totalHours]) => ({ userName, totalHours: roundToTenth(totalHours) }))
        .sort((a, b) => b.totalHours - a.totalHours)
        .slice(0, limit);
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      return [];
    }
  }
}
