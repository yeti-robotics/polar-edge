import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AppConfigService } from "src/config/config.service";
import type { TwofaSignInDto, TwofaValidateDto } from "./twofa.dto";

@Controller("2fa")
export class TwofaController {
  private readonly logger = new Logger(TwofaController.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly jwtService: JwtService
  ) {}

  @Post("authenticate")
  @HttpCode(HttpStatus.ACCEPTED)
  signIn(@Body() { password }: TwofaSignInDto) {
    const expectedPassword = this.config.get("attendance2faPassword");

    if (!password || password !== expectedPassword) {
      this.logger.error("Invalid password");
      throw new UnauthorizedException("Invalid password");
    }

    const token = this.jwtService.sign({
      sub: "attendance-2fa",
    });

    const totpSecret = this.config.get("totpSecret");

    return { message: "Accepted", token, secret: totpSecret };
  }

  @Post("validate")
  @HttpCode(HttpStatus.OK)
  validateToken(@Body() { token }: TwofaValidateDto) {
    try {
      this.jwtService.verify(token);
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException("Invalid token");
    }

    return { message: "Valid" };
  }
}
