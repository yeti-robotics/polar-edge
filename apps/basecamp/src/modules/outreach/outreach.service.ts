import { Injectable } from "@nestjs/common";
import { roundToTenth } from "src/lib/utils/math.utils";
import { OutreachRepository } from "./outreach.repository";

@Injectable()
export class OutreachService {
  constructor(private readonly repository: OutreachRepository) {}

  async getUserOutreach(userName: string) {
    const result = await this.repository.findByUserName(userName);

    if (result.isErr()) return null;

    return result.value;
  }

  async getTotalTeamOutreachHours() {
    const result = await this.repository.findAll();

    if (result.isErr()) return 0;

    const totalHours = result.value.reduce((sum, entry) => sum + entry.hours, 0);
    return Math.round(totalHours * 100) / 100;
  }

  async getTopMembersByHours(limit = 5) {
    const result = await this.repository.findAll();

    if (result.isErr()) return [];

    const outreachData = result.value;

    if (outreachData.length === 0) return [];

    const userHoursMap = new Map<string, number>();
    for (const entry of outreachData) {
      userHoursMap.set(entry.userName, (userHoursMap.get(entry.userName) ?? 0) + entry.hours);
    }

    return Array.from(userHoursMap.entries())
      .map(([userName, totalHours]) => ({ userName, totalHours: roundToTenth(totalHours) }))
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, limit);
  }
}
