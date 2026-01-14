import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { SheetModule } from "../sheet/sheet.module";
import { AttendanceService } from "./attendance.service";
import { TwofaController } from "./twofa/twofa.controller";
import { TwofaService } from "./twofa/twofa.service";

@Module({
  imports: [
    SheetModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get("JWT_SECRET"),
          signOptions: {
            algorithm: "HS256",
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AttendanceService, TwofaService],
  exports: [AttendanceService],
  controllers: [TwofaController],
})
export class AttendanceModule {}
