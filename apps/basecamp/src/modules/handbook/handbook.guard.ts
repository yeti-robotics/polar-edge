import { ExecutionContext, Injectable } from "@nestjs/common";
import { ThrottlerGuard, type ThrottlerLimitDetail } from "@nestjs/throttler";
import { MessageFlags } from "discord.js";
import type { SlashCommandContext } from "necord";

@Injectable()
export class NecordThrottlerGuard extends ThrottlerGuard {
  protected getRequestResponse(context: ExecutionContext) {
    const [interaction] = context.getArgByIndex<SlashCommandContext>(0);
    return { req: interaction, res: interaction };
  }

  protected async getTracker(req: { user: { id: string } }): Promise<string> {
    return req.user.id;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail
  ): Promise<void> {
    const [interaction] = context.getArgByIndex<SlashCommandContext>(0);
    const waitSeconds = Math.ceil(throttlerLimitDetail.timeToExpire / 1000);
    await interaction.reply({
      content: `🌐 The handbook is currently busy. Please try again in ${waitSeconds} seconds.`,
      flags: [MessageFlags.Ephemeral],
    });
  }
}
