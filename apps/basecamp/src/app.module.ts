import { Module } from "@nestjs/common";
import { IntentsBitField } from "discord.js";
import { NecordModule } from "necord";
import { AppConfigModule } from "./config/config.module";
import { AppConfigService } from "./config/config.service";
import { AiModule } from "./lib/ai/ai.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { HandbookModule } from "./modules/handbook/handbook.module";
import { LifecycleModule } from "./modules/lifecycle/lifecycle.module";
import { OutreachModule } from "./modules/outreach/outreach.module";

@Module({
  imports: [
    AppConfigModule,
    AiModule,
    AttendanceModule,
    HandbookModule,
    LifecycleModule,
    OutreachModule,
    NecordModule.forRootAsync({
      useFactory: (configService: AppConfigService) => ({
        token: configService.get("discordToken"),
        development: configService.get("devGuildId") ? [configService.get("devGuildId")] : false,
        intents: [IntentsBitField.Flags.Guilds],
      }),
      inject: [AppConfigService],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
