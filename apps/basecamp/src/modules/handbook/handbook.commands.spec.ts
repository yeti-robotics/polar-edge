import { Test, type TestingModule } from "@nestjs/testing";
import { afterEach, beforeEach, describe, expect, it, type MockedFunction, vi } from "vitest";
import { HandbookCommands } from "./handbook.commands";
import { HandbookService } from "./handbook.service";

// ─── Discord interaction helpers ─────────────────────────────────────────────

function makeInteraction(overrides: Record<string, unknown> = {}) {
  const interaction = {
    user: { id: "user-discord-id" },
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return interaction;
}

// ─── Service mock type ────────────────────────────────────────────────────────

type MockHandbookService = {
  askHandbookQuestion: MockedFunction<HandbookService["askHandbookQuestion"]>;
};

// ─── Module factory ───────────────────────────────────────────────────────────

function makeModule() {
  return Test.createTestingModule({
    providers: [
      HandbookCommands,
      {
        provide: HandbookService,
        useValue: {
          askHandbookQuestion: vi.fn(),
        } satisfies MockHandbookService,
      },
    ],
  }).compile();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type HandbookResponse = Awaited<ReturnType<HandbookService["askHandbookQuestion"]>>;

function makeResponse(overrides: Partial<HandbookResponse> = {}): HandbookResponse {
  return {
    text: "answer",
    finishReason: "stop",
    usage: {
      inputTokens: undefined,
      outputTokens: undefined,
      totalTokens: undefined,
      inputTokenDetails: {
        noCacheTokens: undefined,
        cacheReadTokens: undefined,
        cacheWriteTokens: undefined,
      },
      outputTokenDetails: {
        textTokens: undefined,
        reasoningTokens: undefined,
      },
    },
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("HandbookCommands", () => {
  let commands: HandbookCommands;
  let service: MockHandbookService;

  beforeEach(async () => {
    const module: TestingModule = await makeModule();
    commands = module.get(HandbookCommands);
    service = module.get(HandbookService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(commands).toBeDefined();
  });

  // ─── /handbook ────────────────────────────────────────────────────────────

  describe("onHandbook", () => {
    it("replies with rate-limit message when global limit is exceeded", async () => {
      const interaction = makeInteraction();

      // Exhaust the global rate limit (maxRequests = 2)
      service.askHandbookQuestion.mockResolvedValue(makeResponse());
      await commands.onHandbook([interaction] as never, { question: "q1" });
      await commands.onHandbook([interaction] as never, { question: "q2" });

      // Third call should be rate-limited
      const blockedInteraction = makeInteraction();
      await commands.onHandbook([blockedInteraction] as never, { question: "q3" });

      expect(blockedInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("The handbook is currently busy"),
        })
      );
    });

    it("calls handbookService.askHandbookQuestion with the user's question", async () => {
      const interaction = makeInteraction();
      service.askHandbookQuestion.mockResolvedValue(makeResponse({ text: "The answer is 42." }));

      await commands.onHandbook([interaction] as never, { question: "What is the answer?" });

      expect(service.askHandbookQuestion).toHaveBeenCalledWith("What is the answer?");
    });

    it("replies with formatted question and answer on success", async () => {
      const interaction = makeInteraction();
      service.askHandbookQuestion.mockResolvedValue(makeResponse({ text: "The answer is 42." }));

      await commands.onHandbook([interaction] as never, { question: "What is the answer?" });

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "**Question:** What is the answer?\n\n**Answer:** The answer is 42.",
        })
      );
    });

    it("replies with failure message when service returns empty text", async () => {
      const interaction = makeInteraction();
      service.askHandbookQuestion.mockResolvedValue(makeResponse({ text: "" }));

      await commands.onHandbook([interaction] as never, { question: "Any question?" });

      expect(interaction.reply).toHaveBeenCalledWith(
        "Failed to get a response from the handbook agent."
      );
    });

    it("logs token usage when response.usage is present", async () => {
      const interaction = makeInteraction();
      // biome-ignore lint/complexity/useLiteralKeys: accessing private field in test
      const logSpy = vi.spyOn(commands["logger"], "log");
      service.askHandbookQuestion.mockResolvedValue(
        makeResponse({
          text: "An answer.",
          usage: {
            inputTokens: 10,
            outputTokens: 20,
            totalTokens: 30,
            inputTokenDetails: {
              noCacheTokens: undefined,
              cacheReadTokens: undefined,
              cacheWriteTokens: undefined,
            },
            outputTokenDetails: { textTokens: undefined, reasoningTokens: undefined },
          },
        })
      );

      await commands.onHandbook([interaction] as never, { question: "How?" });

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Prompt: 10"));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Completion: 20"));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Total: 30"));
    });

    it("throws error when service throws", async () => {
      const interaction = makeInteraction();
      service.askHandbookQuestion.mockRejectedValue(new Error("AI service unavailable"));

      await expect(
        commands.onHandbook([interaction] as never, { question: "Will this fail?" })
      ).rejects.toThrow("AI service unavailable");
    });
  });
});
