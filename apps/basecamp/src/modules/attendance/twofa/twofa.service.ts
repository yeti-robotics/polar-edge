import { Injectable } from "@nestjs/common";
import { verifyCode } from "@repo/twofa/server";
import { AppConfigService } from "src/config/config.service";

@Injectable()
export class TwofaService {
  private readonly secret: string;

  constructor(private readonly config: AppConfigService) {
    this.secret = this.config.get("attendance2faSecret");
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
