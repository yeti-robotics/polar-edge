import { Injectable, Logger } from "@nestjs/common";
import {
  type ChatInputCommandInteraction,
  type GuildMember,
  MessageFlags,
  type User,
} from "discord.js";
import {
  Context,
  IntegerOption,
  Options,
  SlashCommand,
  type SlashCommandContext,
  UserOption,
} from "necord";
import type { Result } from "neverthrow";
import { AppConfigService } from "src/config/config.service";
import { getNickname } from "src/lib/utils/discord.utils";
import { formatLeaderboard } from "src/lib/utils/leaderboard.utils";
import { formatPercentage } from "src/lib/utils/math.utils";
import { AttendanceService } from "./attendance.service";

class AttendanceSignInDto {
  @IntegerOption({
    name: "code",
    description: "The code to sign in with",
    required: true,
  })
  code: number;
}

class AttendanceSignOutDto {
  @IntegerOption({
    name: "code",
    description: "The code to sign out with",
    required: true,
  })
  code: number;
}

class AdminSignInDto {
  @UserOption({
    name: "user",
    description: "The user to sign in",
    required: true,
  })
  user: User;
}

class AdminSignOutDto {
  @UserOption({
    name: "user",
    description: "The user to sign out",
    required: true,
  })
  user: User;
}

// Percentage requirements based on hours to date
const MEMBER_REQUIRED_PERCENTAGE = 0.75; // 75% of hours to date
const LEADERSHIP_REQUIRED_PERCENTAGE = 0.85; // 85% of hours to date

@Injectable()
export class AttendanceCommands {
  private readonly logger = new Logger(AttendanceCommands.name);
  private readonly adminRoleId: string;

  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly configService: AppConfigService
  ) {
    this.adminRoleId = this.configService.get("adminRoleId");
  }

  private async handleAttendanceResult(
    interaction: ChatInputCommandInteraction,
    opResult: Result<{ success: boolean; message?: string }, Error>,
    context: {
      operationName: string;
      userId: string;
      successAnnouncement?: string;
      defaultSuccessMessage: string;
      defaultFailureMessage: string;
    }
  ) {
    if (opResult.isErr()) {
      this.logger.error(
        `${context.operationName} failed for ${context.userId}: ${opResult.error.message}`
      );
      return interaction.editReply({ content: "An unexpected error occurred." });
    }

    if (opResult.value.success) {
      if (context.successAnnouncement && interaction.channel?.isSendable()) {
        await interaction.channel.send(context.successAnnouncement).catch((error: unknown) => {
          this.logger.warn(
            `Failed to send ${context.operationName} announcement for ${context.userId}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        });
      }
      return interaction.editReply({
        content: opResult.value.message ?? context.defaultSuccessMessage,
      });
    }

    return interaction.editReply({
      content: opResult.value.message ?? context.defaultFailureMessage,
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

    return this.handleAttendanceResult(interaction, opResult, {
      operationName: "signIn",
      userId: interaction.user.id,
      successAnnouncement: `<@${interaction.user.id}> has signed in.`,
      defaultSuccessMessage: "Signed in successfully",
      defaultFailureMessage: "Failed to sign in.",
    });
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

    return this.handleAttendanceResult(interaction, opResult, {
      operationName: "signOut",
      userId: interaction.user.id,
      successAnnouncement: `<@${interaction.user.id}> has signed out.`,
      defaultSuccessMessage: "Signed out successfully",
      defaultFailureMessage: "Failed to sign out.",
    });
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

    return this.handleAttendanceResult(interaction, opResult, {
      operationName: "admin-signin",
      userId: user.id,
      successAnnouncement: `<@${user.id}> has been signed in by an admin.`,
      defaultSuccessMessage: `Successfully signed in ${nickname}.`,
      defaultFailureMessage: `Failed to sign in ${nickname}.`,
    });
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

    return this.handleAttendanceResult(interaction, opResult, {
      operationName: "admin-signout",
      userId: user.id,
      successAnnouncement: `<@${user.id}> has been signed out by an admin.`,
      defaultSuccessMessage: `Successfully signed out ${nickname}.`,
      defaultFailureMessage: `Failed to sign out ${nickname}.`,
    });
  }

  @SlashCommand({
    name: "attendance",
    description: "Get your current attendance",
  })
  public async onAttendance(@Context() [interaction]: SlashCommandContext) {
    const hoursResult = await this.attendanceService.getUserHours(interaction.user.id);

    if (hoursResult.isErr()) {
      this.logger.error(
        `Error getting attendance for user ${interaction.user.id}: ${hoursResult.error.message}`
      );
      return interaction.reply(
        "There was an error getting your attendance. Please let a mentor know."
      );
    }

    const hours = hoursResult.value;
    const totalPossibleHours = this.attendanceService.getTotalPossibleHoursToDate();

    const hoursPercentage = totalPossibleHours > 0 ? hours / totalPossibleHours : 0;
    const hoursPercentageString = hoursPercentage > 0 ? formatPercentage(hoursPercentage) : "∞";

    const memberRequiredHours = totalPossibleHours * MEMBER_REQUIRED_PERCENTAGE;
    const leadershipRequiredHours = totalPossibleHours * LEADERSHIP_REQUIRED_PERCENTAGE;

    const totalPossibleHoursDisplay = Math.floor(totalPossibleHours);
    if (hours >= leadershipRequiredHours) {
      return interaction.reply(
        `You're currently above the minimum hours for leadership (${hours} hours, ${hoursPercentageString}% of ${totalPossibleHoursDisplay} possible hours to date)! :tada:`
      );
    } else if (hours >= memberRequiredHours) {
      const remainingHours = Math.ceil(leadershipRequiredHours - hours);
      return interaction.reply(
        `You're currently above the minimum hours for members (${hours} hours, ${hoursPercentageString}% of ${totalPossibleHoursDisplay} possible hours to date)! If you're on leadership, you are currently ${remainingHours} hour(s) behind the leadership requirement.`
      );
    } else {
      const remainingHours = Math.ceil(memberRequiredHours - hours);
      return interaction.reply(
        `You've got ${hours} hours (${hoursPercentageString}% of ${totalPossibleHoursDisplay} possible hours to date). You are currently ${remainingHours} hour(s) behind the minimum hours goal. :rocket:`
      );
    }
  }

  @SlashCommand({
    name: "attendance-leaderboard",
    description: "Show the top 5 members by attendance hours",
  })
  public async onAttendanceLeaderboard(@Context() [interaction]: SlashCommandContext) {
    const [leaderboardResult, rankResult, hoursResult, nicknameResult] = await Promise.all([
      this.attendanceService.getTopMembersByHours(5),
      this.attendanceService.getUserRank(interaction.user.id),
      this.attendanceService.getUserHours(interaction.user.id),
      getNickname(interaction),
    ]);

    if (leaderboardResult.isErr()) {
      this.logger.error(`Error getting attendance leaderboard: ${leaderboardResult.error.message}`);
      return interaction.reply("No attendance data found");
    }

    if (leaderboardResult.value.length === 0) {
      return interaction.reply("No attendance data found");
    }

    const userRank = rankResult.isOk() ? rankResult.value : null;
    const userHours = hoursResult.isOk() ? hoursResult.value : null;
    const displayName = nicknameResult.isOk() ? nicknameResult.value : interaction.user.displayName;

    const userEntry =
      userRank != null && userHours != null
        ? { rank: userRank, userName: displayName, totalHours: parseFloat(userHours.toFixed(2)) }
        : null;

    return interaction.reply(
      formatLeaderboard(
        ":clock: **Attendance Leaderboard** :clock:",
        leaderboardResult.value,
        "*Updated in real-time from attendance records*",
        userEntry
      )
    );
  }
}
