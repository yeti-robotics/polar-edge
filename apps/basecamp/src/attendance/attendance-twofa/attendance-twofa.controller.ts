import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Response } from "express";
import type { AttendanceTwofaSignInDto, AttendanceTwofaValidateDto } from "./attendance-twofa.dto";
import { AttendanceTwofaGuard } from "./attendance-twofa.guard";
import { AttendanceTwoFAService } from "./attendance-twofa.service";

@Controller("2fa")
export class AttendanceTwofaController {
  constructor(
    private readonly attendanceTwofaService: AttendanceTwoFAService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ) {}

  @Post("authenticate")
  signIn(@Body() { password }: AttendanceTwofaSignInDto, @Res() res: Response) {
    const expectedPassword = this.configService.get<string | undefined>(
      "ATTENDANCE_2FA_SECRET",
      undefined
    );

    console.log(expectedPassword, password);

    if (!password || password !== expectedPassword) {
      console.error("Invalid password");
      throw new UnauthorizedException("Invalid password");
    }

    const token = this.jwtService.sign({
      sub: "attendance-2fa",
    });

    const totpSecret = this.configService.get<string>("ATTENDANCE_2FA_SECRET");

    return res.status(HttpStatus.ACCEPTED).json({ message: "Accepted", token, secret: totpSecret });
  }

  @Post("validate")
  validateToken(@Body() { token }: AttendanceTwofaValidateDto, @Res() res: Response) {
    try {
      this.jwtService.verify(token);
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException("Invalid token");
    }

    return res.status(HttpStatus.OK).json({ message: "Valid" });
  }
}
