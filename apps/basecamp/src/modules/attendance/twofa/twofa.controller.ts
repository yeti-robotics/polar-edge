import { Body, Controller, HttpStatus, Post, Res, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Response } from "express";
import type { TwofaSignInDto, TwofaValidateDto } from "./twofa.dto";

@Controller("2fa")
export class TwofaController {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ) {}

  @Post("authenticate")
  signIn(@Body() { password }: TwofaSignInDto, @Res() res: Response) {
    const expectedPassword = this.configService.get<string | undefined>(
      "ATTENDANCE_2FA_SECRET",
      undefined
    );

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
  validateToken(@Body() { token }: TwofaValidateDto, @Res() res: Response) {
    try {
      this.jwtService.verify(token);
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException("Invalid token");
    }

    return res.status(HttpStatus.OK).json({ message: "Valid" });
  }
}
