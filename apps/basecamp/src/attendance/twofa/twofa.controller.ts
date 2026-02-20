import {
  Body,
  Controller,
  HttpStatus,
  Logger,
  Post,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { timingSafeEqual } from "crypto";
import type { Response } from "express";
import type { TwofaSignInDto, TwofaValidateDto } from "./twofa.dto";

@Controller("2fa")
export class TwofaController {
  private readonly logger = new Logger(TwofaController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ) {}

  @Post("authenticate")
  signIn(@Body() { password }: TwofaSignInDto, @Res() res: Response) {
    const expectedPassword = this.configService.get<string | undefined>(
      "ATTENDANCE_2FA_PASSWORD",
      undefined
    );

    if (
      !password ||
      !expectedPassword ||
      !this.safeCompare(password, expectedPassword)
    ) {
      this.logger.warn("Failed authentication attempt");
      throw new UnauthorizedException("Invalid password");
    }

    const token = this.jwtService.sign({
      sub: "attendance-2fa",
    });

    return res.status(HttpStatus.ACCEPTED).json({ message: "Accepted", token });
  }

  @Post("validate")
  validateToken(@Body() { token }: TwofaValidateDto, @Res() res: Response) {
    try {
      this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException("Invalid token");
    }

    return res.status(HttpStatus.OK).json({ message: "Valid" });
  }

  @Post("refresh")
  refreshToken(@Body() { token }: TwofaValidateDto, @Res() res: Response) {
    try {
      this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException("Invalid token");
    }

    const newToken = this.jwtService.sign({ sub: "attendance-2fa" });
    return res.status(HttpStatus.OK).json({ token: newToken });
  }

  private safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      // Compare against self to maintain constant time
      timingSafeEqual(bufA, bufA);
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  }
}
