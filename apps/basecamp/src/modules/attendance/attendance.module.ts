import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AppConfigService } from "src/config/config.service";
import { type SheetCredentials, SheetService } from "src/lib/sheet/sheet.service";
import { AttendanceRepository } from "./attendance.repository";
import { AttendanceService } from "./attendance.service";
import { TwofaController } from "./twofa/twofa.controller";
import { TwofaService } from "./twofa/twofa.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: AppConfigService) => {
        return {
          secret: configService.get("jwtSecret"),
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
      useFactory: (config: AppConfigService) => {
        return new SheetService(
          config.get("googleCredentials"),
          config.get("attendanceSpreadsheetId")
        );
      },
      inject: [AppConfigService],
    },
    AttendanceRepository,
    AttendanceService,
    TwofaService,
  ],
  exports: [AttendanceService],
  controllers: [TwofaController],
})
export class AttendanceModule {}
