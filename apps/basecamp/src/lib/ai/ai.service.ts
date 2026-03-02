import { Injectable } from "@nestjs/common";
import { createGradientProvider } from "@repo/ai";
import { AppConfigService } from "src/config/config.service";

@Injectable()
export class AiService {
  private readonly gradientProvider: ReturnType<typeof createGradientProvider>;

  constructor(private readonly config: AppConfigService) {
    const apiKey = this.config.get("doModelAccessKey");
    this.gradientProvider = createGradientProvider(apiKey);
  }

  public getGradientProvider() {
    return this.gradientProvider;
  }
}
