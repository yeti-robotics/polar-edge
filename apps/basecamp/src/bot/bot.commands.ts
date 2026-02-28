import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type ChatInputCommandInteraction, GuildMember, MessageFlags } from "discord.js";
import { Context, Options, SlashCommand, type SlashCommandContext } from "necord";
import {
  AdminSignInDto,
  AdminSignOutDto,
  AttendanceSignInDto,
  AttendanceSignOutDto,
} from "src/attendance/attendance.dto";
import { AttendanceService } from "src/attendance/attendance.service";
import { HandbookService } from "src/handbook/handbook.service";
import { HandbookQuestionDto } from "src/handbook/handbook-question.dto";
import { OutreachService } from "src/outreach/outreach.service";
import {
  ceilToInteger,
  floorToInteger,
  formatPercentage,
  getOrdinalSuffix,
  msToSeconds,
  roundProgressPercentage,
  roundToTenth,
} from "src/utils/math.utils";

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
  private readonly adminRoleId: string;

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
    private readonly handbookService: HandbookService,
    private readonly configService: ConfigService
  ) {
    this.adminRoleId = this.configService.get<string>("ADMIN_ROLE_ID") || "";
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
        content: result.message ?? "Signed in successfully",
      });
    } else {
      return interaction.editReply({
        content: result.message ?? "Failed to sign in.",
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
        content: result.message ?? "Signed out successfully",
      });
    } else {
      return interaction.editReply({
        content: result.message ?? "Failed to sign out.",
      });
    }
  }

  @SlashCommand({
    name: "admin-signin",
    description: "Sign in another user (admin only)",
  })
  public async onAdminSignIn(
    @Context() [interaction]: SlashCommandContext,
    @Options() { user }: AdminSignInDto
  ) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const member = interaction.member as GuildMember;
    if (!member.roles.cache.has(this.adminRoleId)) {
      return interaction.editReply({
        content: "You do not have permission to use this command.",
      });
    }

    const targetMember = await interaction.guild?.members.fetch(user.id);
    const nickname = targetMember?.nickname || null;

    if (!nickname) {
      return interaction.editReply({
        content: "User must have a nickname to sign in.",
      });
    }

    const result = await this.attendanceService.signIn(
      user.id,
      interaction.guild?.id || "",
      nickname,
      undefined,
      true
    );

    if (result.success) {
      if (interaction.channel?.isSendable()) {
        await interaction.channel.send(`<@${user.id}> has been signed in by an admin.`);
      }
      return interaction.editReply({
        content: `Successfully signed in ${nickname}.`,
      });
    } else {
      return interaction.editReply({
        content: result.message ?? `Failed to sign in ${nickname}.`,
      });
    }
  }

  @SlashCommand({
    name: "admin-signout",
    description: "Sign out another user (admin only)",
  })
  public async onAdminSignOut(
    @Context() [interaction]: SlashCommandContext,
    @Options() { user }: AdminSignOutDto
  ) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const member = interaction.member as GuildMember;
    if (!member.roles.cache.has(this.adminRoleId)) {
      return interaction.editReply({
        content: "You do not have permission to use this command.",
      });
    }

    const targetMember = await interaction.guild?.members.fetch(user.id);
    const nickname = targetMember?.nickname || null;

    if (!nickname) {
      return interaction.editReply({
        content: "User must have a nickname to sign out.",
      });
    }

    const result = await this.attendanceService.signOut(
      user.id,
      interaction.guildId || "",
      nickname,
      undefined,
      true
    );

    if (result.success) {
      if (interaction.channel?.isSendable()) {
        await interaction.channel.send(`<@${user.id}> has been signed out by an admin.`);
      }
      return interaction.editReply({
        content: `Successfully signed out ${nickname}.`,
      });
    } else {
      return interaction.editReply({
        content: result.message ?? `Failed to sign out ${nickname}.`,
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
    name: "attendance",
    description: "Get your current attendance",
  })
  public async onAttendance(@Context() [interaction]: SlashCommandContext) {
    const nickname = await this.getNickname(interaction);

    if (!nickname) {
      return interaction.reply("You must have a nickname to get attendance");
    }

    try {
      const [hours, rank] = await Promise.all([
        this.attendanceService.getUserHours(interaction.user.id),
        this.attendanceService.getUserRank(interaction.user.id),
      ]);
      const totalPossibleHours = this.attendanceService.getTotalPossibleHoursToDate();

      const hoursString = floorToInteger(hours);
      const hoursPercentage = totalPossibleHours > 0 ? (hours / totalPossibleHours) * 100 : 0;
      const hoursPercentageString = formatPercentage(hoursPercentage);

      const rankString = rank != null ? ` and ranked ${getOrdinalSuffix(rank)} overall` : "";

      const memberRequiredHours = totalPossibleHours * MEMBER_REQUIRED_PERCENTAGE;
      const leadershipRequiredHours = totalPossibleHours * LEADERSHIP_REQUIRED_PERCENTAGE;

      const totalPossibleHoursDisplay = floorToInteger(totalPossibleHours);
      if (hours >= leadershipRequiredHours) {
        return interaction.reply(
          `You're currently above the minimum hours for leadership${rankString} (${hoursString} hours, ${hoursPercentageString}% of ${totalPossibleHoursDisplay} possible hours to date)! :tada:`
        );
      } else if (hours >= memberRequiredHours) {
        const remainingHours = ceilToInteger(leadershipRequiredHours - hours);
        return interaction.reply(
          `You've currently above the minimum hours for members${rankString} (${hoursString} hours, ${hoursPercentageString}% of ${totalPossibleHoursDisplay} possible hours to date)! If you're on leadership, you are currently ${remainingHours} hour(s) behind the leadership requirement.`
        );
      } else {
        const remainingHours = ceilToInteger(memberRequiredHours - hours);
        return interaction.reply(
          `You've got ${hoursString} hours${rankString} (${hoursPercentageString}% of ${totalPossibleHoursDisplay} possible hours to date). You are currently ${remainingHours} hour(s) behind the minimum hours goal. :rocket:`
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
        content: `**Question:** ${question}\n\n**Answer:** ${response.text}`,
        allowedMentions: { parse: [] }, // Don't ping anyone
      });
    } catch (error) {
      this.logger.error(`Handbook request failed for user ${userId}:`, error);
      throw error;
    }
  }
}
