import { randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";

type CodeSlot = {
  windowId: number;
  code: number;
};

@Injectable()
export class AttendanceTwoFAService {
  private readonly NEW_CODE_INTERVAL = 30_000;
  private slots: [CodeSlot | null, CodeSlot | null] = [null, null];

  /** Gets the window ID for the current time. */
  private getWindowId() {
    const windowStart = Math.floor(Date.now() / this.NEW_CODE_INTERVAL);
    return windowStart;
  }

  /** Generates a 4-digit code for the current window. */
  private generateCode() {
    // Unbiased 4-digit code generation (1000–9999)
    while (true) {
      const n = randomBytes(2).readUInt16BE(0);
      // Find the largest multiple of 9000 less than 65536 (i.e., 63000)
      if (n < 63000) {
        return 1000 + (n % 9000);
      }
    }
  }

  /** Checks if a code exists in the cache for the current window. If not, generates a new code and caches it. */
  public getOrCreateCode() {
    const windowId = this.getWindowId();
    const [current] = this.slots;
    if (current && current.windowId === windowId) {
      return current.code;
    }

    const code = this.generateCode();
    if (current && windowId === current.windowId + 1) {
      this.slots = [{ windowId, code }, current];
    } else {
      this.slots = [{ windowId, code }, null];
    }
    return code;
  }

  /** Verifies a code against the cache for the current window. */
  public verifyCode(code: number) {
    const windowId = this.getWindowId();
    const [current, previous] = this.slots;
    return (
      (current && current.windowId === windowId && current.code === code) ||
      (previous && previous.windowId === windowId - 1 && previous.code === code)
    );
  }
}
