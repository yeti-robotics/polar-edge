import { type ExecutionContext } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, type TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it, type MockedFunction, vi } from "vitest";
import { TwofaGuard } from "./twofa.guard";

function makeContext(authHeader?: unknown) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: { authorization: authHeader } }),
    }),
  };
}

describe("TwofaGuard", () => {
  let guard: TwofaGuard;
  let jwtService: { verifyAsync: MockedFunction<JwtService["verifyAsync"]> };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwofaGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: vi.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<TwofaGuard>(TwofaGuard);
    jwtService = module.get(JwtService);
  });

  it("returns false when Authorization header is absent", async () => {
    expect(await guard.canActivate(makeContext() as ExecutionContext)).toBe(false);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it("returns false when Authorization header is not a string", async () => {
    expect(await guard.canActivate(makeContext(12345) as ExecutionContext)).toBe(false);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it("returns false when Authorization header has no token part", async () => {
    // "Bearer".split(" ")[1] === undefined
    expect(await guard.canActivate(makeContext("Bearer") as ExecutionContext)).toBe(false);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it("returns true when a valid JWT token is present", async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: "attendance-2fa" });
    expect(await guard.canActivate(makeContext("Bearer valid-token") as ExecutionContext)).toBe(
      true
    );
    expect(jwtService.verifyAsync).toHaveBeenCalledWith("valid-token");
  });

  it("returns false when jwtService.verifyAsync throws (invalid/expired token)", async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error("jwt expired"));
    expect(await guard.canActivate(makeContext("Bearer expired-token") as ExecutionContext)).toBe(
      false
    );
  });

  it("returns false when the token value is an empty string", async () => {
    // "Bearer ".split(" ")[1] === ""  →  !token is true
    expect(await guard.canActivate(makeContext("Bearer ") as ExecutionContext)).toBe(false);
  });
});
