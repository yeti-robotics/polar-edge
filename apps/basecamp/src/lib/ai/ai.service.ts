import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createGradientProvider } from "@repo/ai";

@Injectable()
export class AiService {
  private readonly gradientProvider: ReturnType<typeof createGradientProvider>;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("DO_MODEL_ACCESS_KEY");
    if (!apiKey) {
      throw new Error("DO_MODEL_ACCESS_KEY is not set");
    }
    this.gradientProvider = createGradientProvider(apiKey);
  }

  public getGradientProvider() {
    return this.gradientProvider;
  }
}
