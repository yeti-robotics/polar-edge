import { Injectable } from "@nestjs/common";
import { generateText } from "ai";
import { AiService } from "src/lib/ai/ai.service";
import { handbookPrompt } from "./handbook.prompt";

@Injectable()
export class HandbookService {
  constructor(private readonly aiService: AiService) {}

  public async askHandbookQuestion(question: string) {
    const provider = this.aiService.getGradientProvider();
    const model = provider("openai-gpt-oss-20b");

    const result = await generateText({
      model,
      system: handbookPrompt,
      prompt: question,
      temperature: 0.2,
      maxOutputTokens: 500,
    });

    return {
      text: result.text,
      usage: result.usage,
      finishReason: result.finishReason,
    };
  }
}
