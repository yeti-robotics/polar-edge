import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AiModule } from "./ai/ai.module";
import { BotModule } from "./bot/bot.module";
import { HandbookModule } from "./handbook/handbook.module";
import { SheetModule } from "./sheet/sheet.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BotModule,
    SheetModule,
    AiModule,
    HandbookModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
