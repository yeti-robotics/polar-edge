import { Injectable } from "@nestjs/common";
import { AiService } from "../ai/ai.service";
import { handbookPrompt } from "./handbook.prompt";

@Injectable()
export class HandbookService {
  constructor(private readonly aiService: AiService) {}

  public async askHandbookQuestion(question: string) {
    const ai = this.aiService.getAiClient();
    const model = "gemini-2.0-flash";
    const config = {
      responseMimeType: "text/plain",
      systemInstruction: handbookPrompt,
    };
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: question,
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model,
      contents,
      config,
    });

    return response.text;
  }
}
