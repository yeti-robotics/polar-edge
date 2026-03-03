import { type CallHandler, type ExecutionContext } from "@nestjs/common";
import { of } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoggingInterceptor } from "./logging.interceptor";

function makeHttpContext(method: string, url: string, statusCode: number): ExecutionContext {
  return {
    getType: () => "http",
    switchToHttp: () => ({
      getRequest: () => ({ method, url }),
      getResponse: () => ({ statusCode }),
    }),
  } as unknown as ExecutionContext;
}

function makeNonHttpContext(): ExecutionContext {
  return {
    getType: () => "ws",
  } as unknown as ExecutionContext;
}

function makeCallHandler(value: unknown = {}): CallHandler {
  return { handle: () => of(value) };
}

describe("LoggingInterceptor", () => {
  let interceptor: LoggingInterceptor;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    // biome-ignore lint/complexity/useLiteralKeys: accessing private field in test
    logSpy = vi.spyOn(interceptor["logger"], "log").mockImplementation(() => {});
  });

  it("logs HTTP requests with method, url, status, and duration", async () => {
    const context = makeHttpContext("GET", "/health", 200);
    const handler = makeCallHandler();

    await new Promise<void>((resolve) => {
      interceptor.intercept(context, handler).subscribe({
        complete: () => resolve(),
      });
    });

    expect(logSpy).toHaveBeenCalledOnce();
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/^GET \/health 200 \d+ms$/));
  });

  it("logs POST requests with correct status code", async () => {
    const context = makeHttpContext("POST", "/2fa/authenticate", 202);
    const handler = makeCallHandler();

    await new Promise<void>((resolve) => {
      interceptor.intercept(context, handler).subscribe({
        complete: () => resolve(),
      });
    });

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^POST \/2fa\/authenticate 202 \d+ms$/)
    );
  });

  it("skips logging for non-HTTP contexts", async () => {
    const context = makeNonHttpContext();
    const handler = makeCallHandler();

    await new Promise<void>((resolve) => {
      interceptor.intercept(context, handler).subscribe({
        complete: () => resolve(),
      });
    });

    expect(logSpy).not.toHaveBeenCalled();
  });
});
