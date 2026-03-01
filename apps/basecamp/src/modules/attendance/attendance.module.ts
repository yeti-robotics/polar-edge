import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import type { Cache } from "cache-manager";
import { AppConfigService } from "src/config/config.service";
import { SheetService } from "src/lib/sheet/sheet.service";
import { AttendanceCommands } from "./attendance.commands";
import { ATTENDANCE_CACHE_TTL_MS } from "./attendance.constants";
import { AttendanceRepository } from "./attendance.repository";
import { AttendanceService } from "./attendance.service";
import { TwofaController } from "./twofa/twofa.controller";
import { TwofaService } from "./twofa/twofa.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      useFactory: (config: AppConfigService) => {
        return {
          secret: config.get("jwtSecret"),
          signOptions: {
            algorithm: "HS256",
          },
        };
      },
      inject: [AppConfigService],
    }),
  ],
  providers: [
    {
      provide: SheetService,
      useFactory: (config: AppConfigService, cache: Cache) => {
        return new SheetService(
          config.get("googleCredentials"),
          config.get("attendanceSpreadsheetId"),
          cache,
          ATTENDANCE_CACHE_TTL_MS
        );
      },
      inject: [AppConfigService, CACHE_MANAGER],
    },
    AttendanceRepository,
    AttendanceService,
    AttendanceCommands,
    TwofaService,
  ],
  exports: [AttendanceService],
  controllers: [TwofaController],
})
export class AttendanceModule {}
