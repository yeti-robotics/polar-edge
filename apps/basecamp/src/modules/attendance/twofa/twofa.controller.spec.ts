import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, type TestingModule } from "@nestjs/testing";
import { AppConfigService } from "src/config/config.service";
import { beforeEach, describe, expect, it, type MockedFunction, vi } from "vitest";
import { TwofaController } from "./twofa.controller";

/** Minimal mock for Express Response that chains .status().json() */
function makeRes() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  // biome-ignore lint/suspicious/noExplicitAny: mock response
  return { res: { status, json } as any, status, json };
}

describe("TwofaController", () => {
  let controller: TwofaController;
  let jwtService: {
    sign: MockedFunction<JwtService["sign"]>;
    verify: MockedFunction<JwtService["verify"]>;
  };

  const CORRECT_PASSWORD = "super-secret";
  const SIGNED_TOKEN = "signed-jwt-token";

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwofaController],
      providers: [
        {
          provide: AppConfigService,
          useValue: {
            get: vi.fn().mockReturnValue(CORRECT_PASSWORD),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: vi.fn().mockReturnValue(SIGNED_TOKEN),
            verify: vi.fn().mockReturnValue({ sub: "attendance-2fa" }),
          },
        },
      ],
    }).compile();

    controller = module.get<TwofaController>(TwofaController);
    jwtService = module.get(JwtService);
  });

  // -------------------------------------------------------------------------
  // POST /2fa/authenticate  (signIn)
  // -------------------------------------------------------------------------
  describe("signIn (POST /2fa/authenticate)", () => {
    it("throws UnauthorizedException when password is wrong", () => {
      const { res } = makeRes();
      expect(() => controller.signIn({ password: "wrong-password" }, res)).toThrow(
        UnauthorizedException
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it("throws UnauthorizedException when password is empty string", () => {
      const { res } = makeRes();
      expect(() => controller.signIn({ password: "" }, res)).toThrow(UnauthorizedException);
    });

    it("returns 202 with token and secret on correct password", () => {
      const result = controller.signIn({ password: CORRECT_PASSWORD });

      expect(result).toEqual(
        expect.objectContaining({
          message: "Accepted",
          token: SIGNED_TOKEN,
          secret: CORRECT_PASSWORD,
        })
      );
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: "attendance-2fa" });
    });

    it("signs JWT with sub=attendance-2fa", () => {
      const { res } = makeRes();
      controller.signIn({ password: CORRECT_PASSWORD }, res);
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: "attendance-2fa" });
    });
  });

  // -------------------------------------------------------------------------
  // POST /2fa/validate  (validateToken)
  // -------------------------------------------------------------------------
  describe("validateToken (POST /2fa/validate)", () => {
    it("returns 200 with 'Valid' message for a valid token", () => {
      const result = controller.validateToken({ token: "valid-token" });

      expect(result).toEqual({ message: "Valid" });
      expect(jwtService.verify).toHaveBeenCalledWith("valid-token");
    });

    it("throws UnauthorizedException when jwtService.verify throws", () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error("jwt malformed");
      });
      const { res } = makeRes();
      expect(() => controller.validateToken({ token: "bad-token" }, res)).toThrow(
        UnauthorizedException
      );
    });

    it("throws UnauthorizedException with 'Invalid token' message on bad token", () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error("jwt expired");
      });
      const { res } = makeRes();
      expect(() => controller.validateToken({ token: "expired-token" }, res)).toThrow(
        new UnauthorizedException("Invalid token")
      );
    });
  });
});
