import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type ChatInputCommandInteraction, GuildMember, MessageFlags } from "discord.js";
import { Context, Options, SlashCommand, type SlashCommandContext } from "necord";
import { getNickname } from "src/lib/utils/discord.utils";
import { getOrdinalSuffix } from "src/lib/utils/math.utils";
import {
  AdminSignInDto,
  AdminSignOutDto,
  AttendanceSignInDto,
  AttendanceSignOutDto,
} from "./attendance.dto";
import { AttendanceService } from "./attendance.service";

// Percentage requirements based on hours to date
const MEMBER_REQUIRED_PERCENTAGE = 0.75; // 75% of hours to date
const LEADERSHIP_REQUIRED_PERCENTAGE = 0.85; // 85% of hours to date

function floorToInteger(n: number): number {
  return Math.floor(n);
}

function ceilToInteger(n: number): number {
  return Math.ceil(n);
}

function formatPercentage(n: number): string {
  return Math.round(n).toString();
}

@Injectable()
export class AttendanceCommands {
  private readonly logger = new Logger(AttendanceCommands.name);
  private readonly adminRoleId: string;

  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly configService: ConfigService
  ) {
    this.adminRoleId = this.configService.get<string>("ADMIN_ROLE_ID") || "";
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

    const nicknameResult = await getNickname(interaction);

    if (nicknameResult.isErr()) {
      return interaction.editReply({
        content: "You must have a nickname to sign in",
      });
    }

    const opResult = await this.attendanceService.signIn(
      interaction.user.id,
      interaction.guild?.id || "",
      nicknameResult.value,
      code
    );

    if (opResult.isErr()) {
      this.logger.error(`signIn failed for ${interaction.user.id}: ${opResult.error.message}`);
      return interaction.editReply({ content: "An unexpected error occurred." });
    }

    if (opResult.value.success) {
      if (interaction.channel?.isSendable()) {
        await interaction.channel.send(`<@${interaction.user.id}> has signed in.`);
      }
      return interaction.editReply({
        content: opResult.value.message ?? "Signed in successfully",
      });
    } else {
      return interaction.editReply({
        content: opResult.value.message ?? "Failed to sign in.",
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

    const nicknameResult = await getNickname(interaction);

    if (nicknameResult.isErr()) {
      return interaction.editReply({
        content: "You must have a nickname to sign out",
      });
    }

    const opResult = await this.attendanceService.signOut(
      interaction.user.id,
      interaction.guildId || "",
      nicknameResult.value,
      code
    );

    if (opResult.isErr()) {
      this.logger.error(`signOut failed for ${interaction.user.id}: ${opResult.error.message}`);
      return interaction.editReply({ content: "An unexpected error occurred." });
    }

    if (opResult.value.success) {
      if (interaction.channel?.isSendable()) {
        await interaction.channel.send(`<@${interaction.user.id}> has signed out.`);
      }
      return interaction.editReply({
        content: opResult.value.message ?? "Signed out successfully",
      });
    } else {
      return interaction.editReply({
        content: opResult.value.message ?? "Failed to sign out.",
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

    const opResult = await this.attendanceService.signIn(
      user.id,
      interaction.guild?.id || "",
      nickname,
      undefined,
      true
    );

    if (opResult.isErr()) {
      this.logger.error(`admin-signin failed for ${user.id}: ${opResult.error.message}`);
      return interaction.editReply({ content: "An unexpected error occurred." });
    }

    if (opResult.value.success) {
      if (interaction.channel?.isSendable()) {
        await interaction.channel.send(`<@${user.id}> has been signed in by an admin.`);
      }
      return interaction.editReply({
        content: `Successfully signed in ${nickname}.`,
      });
    } else {
      return interaction.editReply({
        content: opResult.value.message ?? `Failed to sign in ${nickname}.`,
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

    const opResult = await this.attendanceService.signOut(
      user.id,
      interaction.guildId || "",
      nickname,
      undefined,
      true
    );

    if (opResult.isErr()) {
      this.logger.error(`admin-signout failed for ${user.id}: ${opResult.error.message}`);
      return interaction.editReply({ content: "An unexpected error occurred." });
    }

    if (opResult.value.success) {
      if (interaction.channel?.isSendable()) {
        await interaction.channel.send(`<@${user.id}> has been signed out by an admin.`);
      }
      return interaction.editReply({
        content: `Successfully signed out ${nickname}.`,
      });
    } else {
      return interaction.editReply({
        content: opResult.value.message ?? `Failed to sign out ${nickname}.`,
      });
    }
  }

  @SlashCommand({
    name: "attendance",
    description: "Get your current attendance",
  })
  public async onAttendance(@Context() [interaction]: SlashCommandContext) {
    const [hoursResult, rankResult] = await Promise.all([
      this.attendanceService.getUserHours(interaction.user.id),
      this.attendanceService.getUserRank(interaction.user.id),
    ]);

    if (hoursResult.isErr() || rankResult.isErr()) {
      const errorMessage = hoursResult.isErr()
        ? hoursResult.error.message
        : rankResult.isErr()
          ? rankResult.error.message
          : "unknown error";
      this.logger.error(
        `Error getting attendance for user ${interaction.user.id}: ${errorMessage}`
      );
      return interaction.reply(
        "There was an error getting your attendance. Please let a mentor know."
      );
    }

    const hours = hoursResult.value;
    const rank = rankResult.value;
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
  }

  @SlashCommand({
    name: "attendance-leaderboard",
    description: "Show the top 5 members by attendance hours",
  })
  public async onAttendanceLeaderboard(@Context() [interaction]: SlashCommandContext) {
    const leaderboardResult = await this.attendanceService.getTopMembersByHours(5);

    if (leaderboardResult.isErr()) {
      this.logger.error(`Error getting attendance leaderboard: ${leaderboardResult.error.message}`);
      return interaction.reply("No attendance data found");
    }

    if (leaderboardResult.value.length === 0) {
      return interaction.reply("No attendance data found");
    }

    const leaderboard = leaderboardResult.value;

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
}
