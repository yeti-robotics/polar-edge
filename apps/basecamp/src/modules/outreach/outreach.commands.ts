import { Injectable, Logger } from "@nestjs/common";
import { Context, SlashCommand, type SlashCommandContext } from "necord";
import { getNickname } from "src/lib/utils/discord.utils";
import { formatLeaderboard } from "src/lib/utils/leaderboard.utils";
import { roundToTenth } from "src/lib/utils/math.utils";
import { OutreachService } from "./outreach.service";

const ROOKIE_THRESHOLD = 50;
const VETERAN_THRESHOLD = 100;

function roundProgressPercentage(hours: number, target: number): number {
  return target > 0 ? Math.round((hours / target) * 100) : 0;
}

@Injectable()
export class OutreachCommands {
  private readonly logger = new Logger(OutreachCommands.name);

  constructor(private readonly outreachService: OutreachService) {}

  @SlashCommand({
    name: "outreach",
    description: "Get your current outreach progress",
  })
  public async onOutreach(@Context() [interaction]: SlashCommandContext) {
    const nicknameResult = await getNickname(interaction);

    if (nicknameResult.isErr()) {
      return interaction.reply("You must have a nickname set to get outreach");
    }

    const nickname = nicknameResult.value;

    const outreachResult = await this.outreachService.getUserOutreach(nickname);

    if (outreachResult.isErr()) {
      this.logger.error(`Error getting outreach for ${nickname}: ${outreachResult.error.message}`);
      return interaction.reply("No outreach found for you");
    }

    const outreach = outreachResult.value;
    const hourTotal = roundToTenth(outreach.reduce((acc, curr) => acc + curr.hours, 0));

    let outreachString = `:snowflake: Outreach for ${nickname} :snowflake:\n\n**Total hours:** ${hourTotal}`;

    if (hourTotal < ROOKIE_THRESHOLD) {
      outreachString += `\n- You need ${ROOKIE_THRESHOLD - hourTotal} more hours to reach the rookie minimum (${roundProgressPercentage(hourTotal, ROOKIE_THRESHOLD)}% complete)\n- You need ${VETERAN_THRESHOLD - hourTotal} more hours to reach the veteran minimum (${roundProgressPercentage(hourTotal, VETERAN_THRESHOLD)}% complete)`;
    } else if (hourTotal < VETERAN_THRESHOLD) {
      outreachString += `\n- ✅ Rookie minimum achieved!\n- You need ${VETERAN_THRESHOLD - hourTotal} more hours to reach the veteran minimum (${roundProgressPercentage(hourTotal, VETERAN_THRESHOLD)}% complete)`;
    } else {
      outreachString += `\n- 🎉 Veteran minimum achieved! Great work!`;
    }

    outreachString +=
      "\n*Please reach out to Ms. I in <#408795997410426880> if you feel our record of your outreach is incorrect*";

    return interaction.reply(outreachString);
  }

  @SlashCommand({
    name: "outreach-leaderboard",
    description: "Show the top 5 members by outreach hours",
  })
  public async onOutreachLeaderboard(@Context() [interaction]: SlashCommandContext) {
    const [leaderboardResult, totalTeamHoursResult] = await Promise.all([
      this.outreachService.getTopMembersByHours(5),
      this.outreachService.getTotalTeamOutreachHours(),
    ]);

    if (leaderboardResult.isErr()) {
      this.logger.error(`Error getting outreach leaderboard: ${leaderboardResult.error.message}`);
      return interaction.reply("No outreach data found");
    }

    if (leaderboardResult.value.length === 0) {
      return interaction.reply("No outreach data found");
    }

    const totalTeamHours = totalTeamHoursResult.isOk() ? totalTeamHoursResult.value : 0;

    return interaction.reply(
      formatLeaderboard(
        `:trophy: **Outreach Leaderboard** :trophy:\n:chart_with_upwards_trend: **Team Total: ${totalTeamHours} hours** :chart_with_upwards_trend:`,
        leaderboardResult.value,
        "*Updated in real-time from outreach records*"
      )
    );
  }
}
