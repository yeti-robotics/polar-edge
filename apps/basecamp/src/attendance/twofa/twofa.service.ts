import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { verifyCode } from "@repo/twofa/server";

@Injectable()
export class TwofaService {
  private readonly secret: string;

  constructor(private readonly configService: ConfigService) {
    const secret = this.configService.get<string>("ATTENDANCE_2FA_SECRET");
    if (!secret) {
      throw new Error("ATTENDANCE_2FA_SECRET is required for TOTP");
    }
    this.secret = secret;
  }

  /** Verifies a TOTP code against the shared secret. */
  public verifyCode(code: number): boolean {
    return verifyCode(code, this.secret, {
      timeStep: 30,
      digits: 4,
      algorithm: "sha1",
      window: 1, // Allow current and previous time window
    });
  }
}
