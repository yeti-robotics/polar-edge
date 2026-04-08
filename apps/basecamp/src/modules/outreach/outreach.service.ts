import { Injectable } from "@nestjs/common";
import { type ResultAsync } from "neverthrow";
import { roundToTenth } from "src/lib/utils/math.utils";
import { OutreachRepository } from "./outreach.repository";
import { type OutreachRecord } from "./outreach.schema";

@Injectable()
export class OutreachService {
  constructor(private readonly repository: OutreachRepository) {}

  getUserOutreach(userName: string): ResultAsync<OutreachRecord[], Error> {
    return this.repository.findByUserName(userName);
  }

  getTotalTeamOutreachHours(): ResultAsync<number, Error> {
    return this.repository.findAll().map((records) => {
      const totalHours = records.reduce((sum, entry) => sum + entry.hours, 0);
      return Math.round(totalHours * 100) / 100;
    });
  }

  getTopMembersByHours(limit = 5): ResultAsync<{ userName: string; totalHours: number }[], Error> {
    return this.repository.findAll().map((outreachData) => {
      if (outreachData.length === 0) return [];

      const userHoursMap = new Map<string, number>();
      for (const entry of outreachData) {
        userHoursMap.set(entry.userName, (userHoursMap.get(entry.userName) ?? 0) + entry.hours);
      }

      return Array.from(userHoursMap.entries())
        .map(([userName, totalHours]) => ({ userName, totalHours: roundToTenth(totalHours) }))
        .sort((a, b) => b.totalHours - a.totalHours)
        .slice(0, limit);
    });
  }

  getUserRankAndHours(
    userName: string
  ): ResultAsync<{ rank: number | null; totalHours: number }, Error> {
    return this.repository.findAll().map((outreachData) => {
      const userHoursMap = new Map<string, number>();
      for (const entry of outreachData) {
        userHoursMap.set(entry.userName, (userHoursMap.get(entry.userName) ?? 0) + entry.hours);
      }
      const userHoursRaw = userHoursMap.get(userName);
      if (userHoursRaw == null) return { rank: null, totalHours: 0 };
      const totalHours = roundToTenth(userHoursRaw);
      const distinctHigher = new Set(
        Array.from(userHoursMap.values()).filter((h) => h > userHoursRaw)
      );
      return { rank: distinctHigher.size + 1, totalHours };
    });
  }
}
