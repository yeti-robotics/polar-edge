import { Test } from "@nestjs/testing";
import { AppConfigService } from "src/config/config.service";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TwofaService } from "./twofa.service";

// vi.mock is hoisted above variable declarations, so use vi.hoisted() to create
// the mock reference without importing @repo/twofa/server directly.
// (spec files are excluded from tsconfig.json, so subpath exports can't be resolved by the IDE)
const { mockVerifyCode } = vi.hoisted(() => ({
  mockVerifyCode: vi.fn().mockReturnValue(true),
}));

vi.mock("@repo/twofa/server", () => ({
  verifyCode: mockVerifyCode,
  generateTOTP: vi.fn(),
  verifyTOTP: vi.fn(),
}));

async function buildService(secret: string | undefined) {
  const module = await Test.createTestingModule({
    providers: [
      TwofaService,
      {
        provide: AppConfigService,
        useValue: {
          get: vi.fn().mockReturnValue(secret),
        },
      },
    ],
  }).compile();
  return module.get<TwofaService>(TwofaService);
}

describe("TwofaService", () => {
  describe("verifyCode", () => {
    let service: TwofaService;

    beforeEach(async () => {
      mockVerifyCode.mockReset();
      service = await buildService("my-secret");
    });

    it("returns true when the underlying verifyCode returns true", () => {
      mockVerifyCode.mockReturnValue(true);

      expect(service.verifyCode(123456)).toBe(true);
      expect(mockVerifyCode).toHaveBeenCalledWith(
        123456,
        "my-secret",
        expect.objectContaining({
          timeStep: 30,
          digits: 4,
          algorithm: "sha1",
          window: 1,
        })
      );
    });

    it("returns false when the underlying verifyCode returns false", () => {
      mockVerifyCode.mockReturnValue(false);

      expect(service.verifyCode(999999)).toBe(false);
    });
  });
});
