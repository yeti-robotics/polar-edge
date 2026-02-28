import { Module } from "@nestjs/common";
import { BotModule } from "./bot/bot.module";
import { AppConfigModule } from "./config/config.module";
import { AiModule } from "./lib/ai/ai.module";
import { HandbookModule } from "./modules/handbook/handbook.module";

@Module({
  imports: [AppConfigModule, BotModule, AiModule, HandbookModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
