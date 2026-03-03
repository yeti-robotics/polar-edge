import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { IntentsBitField } from "discord.js";
import { NecordModule } from "necord";
import { AppConfigModule } from "./config/config.module";
import { AppConfigService } from "./config/config.service";
import { AiModule } from "./lib/ai/ai.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { HandbookModule } from "./modules/handbook/handbook.module";
import { HealthModule } from "./modules/health/health.module";
import { LifecycleModule } from "./modules/lifecycle/lifecycle.module";
import { OutreachModule } from "./modules/outreach/outreach.module";

@Module({
  imports: [
    CacheModule.register({ isGlobal: true }),
    AppConfigModule,
    AiModule,
    AttendanceModule,
    HandbookModule,
    LifecycleModule,
    OutreachModule,
    NecordModule.forRootAsync({
      useFactory: (configService: AppConfigService) => {
        const devGuildId = configService.get("devGuildId");
        return {
          token: configService.get("discordToken"),
          development: devGuildId ? [devGuildId] : false,
          intents: [IntentsBitField.Flags.Guilds],
        };
      },
      inject: [AppConfigService],
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory: (config: AppConfigService) => {
        return {
          secret: config.get("jwtSecret"),
          signOptions: {
            algorithm: "HS256",
            expiresIn: "24h",
          },
        };
      },
      inject: [AppConfigService],
    }),
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
