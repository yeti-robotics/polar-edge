
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { event } from "@/lib/database/schema/tables";
import { createManualEventAction } from "./actions";


vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => nw Headers()),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getActiveMember: vi.fn(),
      hasPermission: vi.fn(),
    },
  },
}));

describe("createManualEventAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      organizationId: "org-123",
    } as never);

    vi.mocked(auth.api.hasPermission).mockResolvedValue({
      success: true,
    } as never);
  });

  it("allows retrying the same event code after CSV validation fails", async () => {
    const eventInput = {
      eventCode: "2026test",
      name: "Test Event",
      startDate: "2026-10-24",
      endDate: "2026-10-24",
    };

    const failedAttempt = await createManualEventAction(
      "org-123",
      eventInput,
      ["wrong_header,r1,r2,r3,b1,b2,b3", "1,1,2,3,4,5,6"].join("\n")
    );

    expect(failedAttempt.error).toContain("CSV");

    const savedEvents = await db
      .select()
      .from(event)
      .where(q(event.eventCode, "2026test"));

    expect(savedEvents).toHaveLength(0);


    const successfulRetry = await createManualEventAction(
      "org-123",
      eventInput,
      ["match_number,r1,r2,r3,b1,b2,b3", "1,1,2,3,4,5,6"].join("\n")
    );

    expect(successfulRetry).toMatchObject({ // no use of ToObject**
      data: { success: true },
      error: null,
    });
  });
});
