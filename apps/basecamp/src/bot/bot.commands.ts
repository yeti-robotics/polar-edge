import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MessageFlags } from "discord.js";
import { Context, Options, SlashCommand, type SlashCommandContext } from "necord";
import { HandbookService } from "src/modules/handbook/handbook.service";
import { HandbookQuestionDto } from "src/modules/handbook/handbook-question.dto";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message: string;
}

function msToSeconds(ms: number): number {
  return Math.ceil(ms / 1000);
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
