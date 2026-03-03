import { Injectable, Logger, UseGuards } from "@nestjs/common";
import { Context, Options, SlashCommand, type SlashCommandContext, StringOption } from "necord";
import { NecordThrottlerGuard } from "./handbook.guard";
import { HandbookService } from "./handbook.service";

class HandbookQuestionDto {
  @StringOption({
    name: "question",
    description: "Your question",
    required: true,
  })
  question: string;
}

@Injectable()
export class HandbookCommands {
  private readonly logger = new Logger(HandbookCommands.name);

  constructor(private readonly handbookService: HandbookService) {}

  @UseGuards(NecordThrottlerGuard)
  @SlashCommand({
    name: "handbook",
    description: "Ask the handbook a question",
  })
  public async onHandbook(
    @Context() [interaction]: SlashCommandContext,
    @Options() { question }: HandbookQuestionDto
  ) {
    const userId = interaction.user.id;

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
        allowedMentions: { parse: [] },
      });
    } catch (error) {
      this.logger.error(`Handbook request failed for user ${userId}:`, error);
      return interaction.reply("An unexpected error occurred while querying the handbook.");
    }
  }
}
