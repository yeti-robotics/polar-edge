import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, type TestingModule } from "@nestjs/testing";
import { AppConfigService } from "src/config/config.service";
import { beforeEach, describe, expect, it, type MockedFunction, vi } from "vitest";
import { TwofaController } from "./twofa.controller";

describe("TwofaController", () => {
  let controller: TwofaController;
  let jwtService: {
    sign: MockedFunction<JwtService["sign"]>;
    verify: MockedFunction<JwtService["verify"]>;
  };

  const CORRECT_PASSWORD = "super-secret-password";
  const CORRECT_TOTP_SECRET = "totp-seed-secret";
  const SIGNED_TOKEN = "signed-jwt-token";

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwofaController],
      providers: [
        {
          provide: AppConfigService,
          useValue: {
            get: vi.fn().mockImplementation((key: string) => {
              if (key === "attendance2faPassword") return CORRECT_PASSWORD;
              if (key === "totpSecret") return CORRECT_TOTP_SECRET;
              return undefined;
            }),
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
      expect(() => controller.signIn({ password: "wrong-password" })).toThrow(
        UnauthorizedException
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it("throws UnauthorizedException when password is empty string", () => {
      expect(() => controller.signIn({ password: "" })).toThrow(UnauthorizedException);
    });

    it("returns 202 with token and secret on correct password", () => {
      const result = controller.signIn({ password: CORRECT_PASSWORD });

      expect(result).toEqual(
        expect.objectContaining({
          message: "Accepted",
          token: SIGNED_TOKEN,
          secret: CORRECT_TOTP_SECRET,
        })
      );
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: "attendance-2fa" });
    });

    it("secret in response is the TOTP seed, not the password", () => {
      const result = controller.signIn({ password: CORRECT_PASSWORD });
      expect(result.secret).toBe(CORRECT_TOTP_SECRET);
      expect(result.secret).not.toBe(CORRECT_PASSWORD);
    });

    it("signs JWT with sub=attendance-2fa", () => {
      controller.signIn({ password: CORRECT_PASSWORD });
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
      expect(() => controller.validateToken({ token: "bad-token" })).toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException with 'Invalid token' message on bad token", () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error("jwt expired");
      });
      expect(() => controller.validateToken({ token: "expired-token" })).toThrow(
        new UnauthorizedException("Invalid token")
      );
    });
  });
});
