import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IntentsBitField } from "discord.js";
import { NecordModule } from "necord";
import { AttendanceModule } from "src/attendance/attendance.module";
import { OutreachModule } from "src/outreach/outreach.module";
import { HandbookModule } from "../handbook/handbook.module";
import { BotCommands } from "./bot.commands";

@Module({
  imports: [
    NecordModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const token = configService.get<string>("DISCORD_TOKEN");
        const devGuildId = configService.get<string>("DEV_GUILD_ID");
        if (!token) {
          throw new Error("DISCORD_TOKEN is not set");
        }
        return {
          token,
          development: devGuildId ? [devGuildId] : false,
          intents: [IntentsBitField.Flags.Guilds],
        };
      },
      inject: [ConfigService],
    }),
    HandbookModule,
    AttendanceModule,
    OutreachModule,
  ],
  providers: [BotCommands],
})
export class BotModule {}
