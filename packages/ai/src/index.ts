import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createGradientProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "gradient",
    baseURL: "https://inference.do-ai.run/v1",
    apiKey: apiKey,
  });
}
