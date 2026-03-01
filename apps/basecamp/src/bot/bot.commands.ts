import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Context, Options, SlashCommand, type SlashCommandContext } from "necord";
import { roundToTenth } from "src/lib/utils/math.utils";
import { HandbookService } from "src/modules/handbook/handbook.service";
import { HandbookQuestionDto } from "src/modules/handbook/handbook-question.dto";
import { OutreachService } from "src/modules/outreach/outreach.service";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message: string;
}

@Injectable()
export class BotCommands {
  private readonly logger = new Logger(BotCommands.name);

  // Global rate limiting
  private readonly globalRequests: number[] = [];
  private readonly globalRateLimit: RateLimitConfig = {
    maxRequests: 2, // 10 requests per minute
    windowMs: 60000, // 1 minute
    message: "🌐 The handbook is currently busy. Please try again in {time} seconds.",
  };

  constructor(
    private readonly outreachService: OutreachService,
    private readonly handbookService: HandbookService,
    private readonly configService: ConfigService
  ) {
    // Clean up old requests periodically
    setInterval(() => this.cleanupRequests(), 30000); // Every 30 seconds
  }

  private cleanupRequests() {
    const now = Date.now();

    // Clean global requests
    while (this.globalRequests.length > 0) {
      const oldestRequest = this.globalRequests[0];
      if (oldestRequest && now - oldestRequest > this.globalRateLimit.windowMs) {
        this.globalRequests.shift();
      } else {
        break;
      }
    }
  }

  private checkRateLimit(
    requests: number[],
    config: RateLimitConfig
  ): { limited: boolean; waitTime?: number } {
    const now = Date.now();

    // Remove old requests
    while (requests.length > 0) {
      const oldestRequest = requests[0];
      if (oldestRequest && now - oldestRequest > config.windowMs) {
        requests.shift();
      } else {
        break;
      }
    }

    if (requests.length >= config.maxRequests) {
      const oldestRequest = requests[0];
      if (oldestRequest !== undefined) {
        const waitTime = msToSeconds(oldestRequest + config.windowMs - now);
        return { limited: true, waitTime };
      }
    }

    return { limited: false };
  }

  private addRequest(requests: number[]) {
    requests.push(Date.now());
  }

  private async getNickname(interaction: ChatInputCommandInteraction) {
    const member = await interaction.guild?.members.fetch(interaction.user.id);
    return member?.nickname || null;
  }

  @SlashCommand({
    name: "ping",
    description: "Ping the bot",
    dmPermission: true,
  })
  public async onPing(@Context() [interaction]: SlashCommandContext) {
    return interaction.reply({
      content: `Pong! ${interaction.client.ws.ping}ms`,
      flags: [MessageFlags.Ephemeral],
    });
  }

  @SlashCommand({
    name: "outreach",
    description: "Get your current outreach progress",
  })
  public async onOutreach(@Context() [interaction]: SlashCommandContext) {
    const nickname = await this.getNickname(interaction);

    if (!nickname) {
      return interaction.reply("You must have a nickname set to get outreach");
    }

    const outreach = await this.outreachService.getUserOutreach(nickname);

    if (!outreach) {
      return interaction.reply("No outreach found for you");
    }

    const hourTotal = roundToTenth(outreach.reduce((acc, curr) => acc + curr.hours, 0));

    let outreachString = `:snowflake: Outreach for ${nickname} :snowflake:\n\n**Total hours:** ${hourTotal}`;

    if (hourTotal < 50) {
      outreachString += `\n- You need ${50 - hourTotal} more hours to reach the rookie minimum (${roundProgressPercentage(hourTotal, 50)}% complete)\n- You need ${100 - hourTotal} more hours to reach the veteran minimum (${roundProgressPercentage(hourTotal, 100)}% complete)`;
    } else if (hourTotal < 100) {
      outreachString += `\n- ✅ Rookie minimum achieved!\n- You need ${100 - hourTotal} more hours to reach the veteran minimum (${roundProgressPercentage(hourTotal, 100)}% complete)`;
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
    const [leaderboard, totalTeamHours] = await Promise.all([
      this.outreachService.getTopMembersByHours(5),
      this.outreachService.getTotalTeamOutreachHours(),
    ]);

    if (!leaderboard || leaderboard.length === 0) {
      return interaction.reply("No outreach data found");
    }

    let leaderboardString = `:trophy: **Outreach Leaderboard** :trophy:\n:chart_with_upwards_trend: **Team Total: ${totalTeamHours} hours** :chart_with_upwards_trend:\n\n`;

    leaderboard.forEach((entry, index) => {
      const rank = index + 1;
      let prefix = "";

      // Medal emojis for top 3, numbers for 4th and 5th
      switch (rank) {
        case 1:
          prefix = ":first_place_medal:";
          break;
        case 2:
          prefix = ":second_place_medal:";
          break;
        case 3:
          prefix = ":third_place_medal:";
          break;
        case 4:
          prefix = "4.";
          break;
        case 5:
          prefix = "5.";
          break;
      }

      leaderboardString += `${prefix} **${entry.userName}** - ${entry.totalHours} hours\n`;
    });

    leaderboardString += "\n*Updated in real-time from outreach records*";

    return interaction.reply(leaderboardString);
  }

  @SlashCommand({
    name: "handbook",
    description: "Ask the handbook a question",
  })
  public async onHandbook(
    @Context() [interaction]: SlashCommandContext,
    @Options() { question }: HandbookQuestionDto
  ) {
    const userId = interaction.user.id;

    // Check global rate limit
    const globalLimit = this.checkRateLimit(this.globalRequests, this.globalRateLimit);
    if (globalLimit.limited) {
      this.logger.warn(`Global rate limit reached. User ${userId} blocked.`);
      return interaction.reply({
        content: this.globalRateLimit.message.replace(
          "{time}",
          globalLimit.waitTime?.toString() || "0"
        ),
        flags: [MessageFlags.Ephemeral],
      });
    }

    if (!question) {
      return interaction.reply("Please provide a question to ask the handbook");
    }

    // Add requests to both counters
    this.addRequest(this.globalRequests);

    this.logger.log(`Handbook request from user ${userId}: ${question.substring(0, 50)}...`);

    try {
      const response = await this.handbookService.askHandbookQuestion(question);

      if (!response || !response.text) {
        return interaction.reply("Failed to get a response from the handbook agent.");
      }

      if (response.usage) {
        this.logger.log(
          `Handbook response usage - Prompt: ${response.usage.inputTokens}, Completion: ${response.usage.outputTokens}, Total: ${response.usage.totalTokens}`
        );
      }

      return interaction.reply({
        content: `**Question:** ${question}\n\n**Answer:** ${response.text}`,
        allowedMentions: { parse: [] }, // Don't ping anyone
      });
    } catch (error) {
      this.logger.error(`Handbook request failed for user ${userId}:`, error);
      throw error;
    }
  }
}
