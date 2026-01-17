import { Injectable, Logger } from "@nestjs/common";
import { type ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Context, Options, SlashCommand, type SlashCommandContext } from "necord";
import { AttendanceSignInDto, AttendanceSignOutDto } from "src/attendance/attendance.dto";
import { AttendanceService } from "src/attendance/attendance.service";
import { HandbookService } from "src/handbook/handbook.service";
import { HandbookQuestionDto } from "src/handbook/handbook-question.dto";
import { OutreachService } from "src/outreach/outreach.service";

// Percentage requirements based on hours to date
const MEMBER_REQUIRED_PERCENTAGE = 0.75; // 75% of hours to date
const LEADERSHIP_REQUIRED_PERCENTAGE = 0.85; // 85% of hours to date

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
    private readonly attendanceService: AttendanceService,
    private readonly outreachService: OutreachService,
    private readonly handbookService: HandbookService
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
        const waitTime = Math.ceil((oldestRequest + config.windowMs - now) / 1000);
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
    name: "signin",
    description: "Sign in to a YETI meeting at the zone",
  })
  public async onSignIn(
    @Context() [interaction]: SlashCommandContext,
    @Options() { code }: AttendanceSignInDto
  ) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const nickname = await this.getNickname(interaction);

    if (!nickname) {
      return interaction.editReply({
        content: "You must have a nickname to sign in",
      });
    }

    const result = await this.attendanceService.signIn(
      interaction.user.id,
      interaction.guild?.id || "",
      nickname,
      code
    );

    if (result.success) {
      if (interaction.channel?.isSendable()) {
        await interaction.channel.send(`<@${interaction.user.id}> has signed in.`);
      }
      return interaction.editReply({
        content: "Signed in successfully",
      });
    } else {
      return interaction.editReply({
        content: "Failed to sign in!",
      });
    }
  }

  @SlashCommand({
    name: "signout",
    description: "Sign out of a YETI meeting at the zone",
  })
  public async onSignOut(
    @Context() [interaction]: SlashCommandContext,
    @Options() { code }: AttendanceSignOutDto
  ) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const nickname = await this.getNickname(interaction);

    if (!nickname) {
      return interaction.editReply({
        content: "You must have a nickname to sign out",
      });
    }

    const result = await this.attendanceService.signOut(
      interaction.user.id,
      interaction.guildId || "",
      nickname,
      code
    );

    if (result.success) {
      if (interaction.channel?.isSendable()) {
        await interaction.channel.send(`<@${interaction.user.id}> has signed out.`);
      }
      return interaction.editReply({
        content: "Signed out successfully",
      });
    } else {
      return interaction.editReply({
        content: "Failed to sign out!",
      });
    }
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

    const hourTotal = outreach.reduce((acc, curr) => acc + curr.hours, 0);

    let outreachString = `:snowflake: Outreach for ${nickname} :snowflake:\n\n**Total hours:** ${hourTotal}`;

    if (hourTotal < 50) {
      outreachString += `\n- You need ${50 - hourTotal} more hours to reach the rookie minimum (${Math.round(
        (100 * hourTotal) / 50
      )}% complete)\n- You need ${100 - hourTotal} more hours to reach the veteran minimum (${Math.round(
        (100 * hourTotal) / 100
      )}% complete)`;
    } else if (hourTotal < 100) {
      outreachString += `\n- ✅ Rookie minimum achieved!\n- You need ${100 - hourTotal} more hours to reach the veteran minimum (${Math.round(
        (100 * hourTotal) / 100
      )}% complete)`;
    } else {
      outreachString += `\n- 🎉 Veteran minimum achieved! Great work!`;
    }

    outreachString +=
      "\n*Please reach out to Ms. I in <#408795997410426880> if you feel our record of your outreach is incorrect*";

    return interaction.reply(outreachString);
  }

  @SlashCommand({
    name: "attendance",
    description: "Get your current attendance",
  })
  public async onAttendance(@Context() [interaction]: SlashCommandContext) {
    const nickname = await this.getNickname(interaction);

    if (!nickname) {
      return interaction.reply("You must have a nickname to get attendance");
    }

    try {
      const hours = await this.attendanceService.getUserHours(interaction.user.id);
      const totalPossibleHours = this.attendanceService.getTotalPossibleHoursToDate();

      //Floors hours to the nearest integer
      const hoursString = Math.floor(hours);
      //Calculates hoursPercentage based on hours to date
      const hoursPercentage = totalPossibleHours > 0 ? (hours / totalPossibleHours) * 100 : 0;
      //Rounds hoursPercentage to 2 decimal places
      const hoursPercentageString = hoursPercentage.toFixed(2);

      // Calculate required hours based on percentage of hours to date
      const memberRequiredHours = totalPossibleHours * MEMBER_REQUIRED_PERCENTAGE;
      const leadershipRequiredHours = totalPossibleHours * LEADERSHIP_REQUIRED_PERCENTAGE;

      if (hours >= leadershipRequiredHours) {
        return interaction.reply(
          `You've met the minimum hours for leadership (${hoursString} hours, ${hoursPercentageString}% of ${Math.floor(totalPossibleHours)} possible hours to date)! :tada:`
        );
      } else if (hours >= memberRequiredHours) {
        const remainingHours = Math.ceil(leadershipRequiredHours - hours);
        return interaction.reply(
          `You've met the minimum hours for members (${hoursString} hours, ${hoursPercentageString}% of ${Math.floor(totalPossibleHours)} possible hours to date)! If you're on leadership, you still have ${remainingHours} more hours to go to hit your leadership requirement.`
        );
      } else {
        const remainingHours = Math.ceil(memberRequiredHours - hours);
        return interaction.reply(
          `You've got ${hoursString} hours (${hoursPercentageString}% of ${Math.floor(totalPossibleHours)} possible hours to date). You have ${remainingHours} more hours to go to hit your minimum hours goal! :rocket:`
        );
      }
    } catch (error) {
      this.logger.error(`Error getting attendance for user ${interaction.user.id}:`, error);
      return interaction.reply(
        "There was an error getting your attendance. Please let a mentor know."
      );
    }
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
    name: "attendance-leaderboard",
    description: "Show the top 5 members by attendance hours",
  })
  public async onAttendanceLeaderboard(@Context() [interaction]: SlashCommandContext) {
    const leaderboard = await this.attendanceService.getTopMembersByHours(5);

    if (!leaderboard || leaderboard.length === 0) {
      return interaction.reply("No attendance data found");
    }

    let leaderboardString = ":clock: **Attendance Leaderboard** :clock:\n\n";

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

    leaderboardString += "\n*Updated in real-time from attendance records*";

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
        content: response.text,
        allowedMentions: { parse: [] }, // Don't ping anyone
      });
    } catch (error) {
      this.logger.error(`Handbook request failed for user ${userId}:`, error);
      throw error;
    }
  }
}
