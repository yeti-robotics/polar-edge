/** biome-ignore-all lint/suspicious/noExplicitAny: this is a test file, so we can use any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/auth";
import {
  type UpdateOrganizationNameState,
  updateCoprFallbackAction,
  updateOrganizationNameAction,
} from "./actions";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getActiveMember: vi.fn(),
      getFullOrganization: vi.fn(),
      hasPermission: vi.fn(),
      updateOrganization: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

const initialState: UpdateOrganizationNameState = { data: null, error: null };

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.set(key, value);
  }
  return fd;
}

describe("updateOrganizationNameAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.api.hasPermission).mockResolvedValue({ success: true } as any);
  });

  it("should return error if not authenticated", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue(null as any);

    const result = await updateOrganizationNameAction(
      initialState,
      makeFormData({ organizationId: "org-123", name: "New Name" })
    );

    expect(result).toEqual({
      data: null,
      error: "Only organization admins and owners can update settings",
    });
  });

  it("should return error if user is a regular member", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "member",
      userId: "user-123",
      createdAt: new Date(),
    } as any);
    vi.mocked(auth.api.hasPermission).mockResolvedValue({ success: false } as any);

    const result = await updateOrganizationNameAction(
      initialState,
      makeFormData({ organizationId: "org-123", name: "New Name" })
    );

    expect(result).toEqual({
      data: null,
      error: "Only organization admins and owners can update settings",
    });
  });

  it("should return error if organization ID does not match", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-999",
      role: "admin",
      userId: "user-123",
      createdAt: new Date(),
    } as any);

    const result = await updateOrganizationNameAction(
      initialState,
      makeFormData({ organizationId: "org-123", name: "New Name" })
    );

    expect(result).toEqual({
      data: null,
      error: "Only organization admins and owners can update settings",
    });
  });

  it("should return error if name is empty", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "admin",
      userId: "user-123",
      createdAt: new Date(),
    } as any);

    const result = await updateOrganizationNameAction(
      initialState,
      makeFormData({ organizationId: "org-123", name: "" })
    );

    expect(result).toEqual({
      data: null,
      error: "Organization name is required",
    });
  });

  it("should return error if name is only whitespace", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "admin",
      userId: "user-123",
      createdAt: new Date(),
    } as any);

    const result = await updateOrganizationNameAction(
      initialState,
      makeFormData({ organizationId: "org-123", name: "   " })
    );

    expect(result).toEqual({
      data: null,
      error: "Organization name is required",
    });
  });

  it("should return error if name exceeds 100 characters", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "admin",
      userId: "user-123",
      createdAt: new Date(),
    } as any);

    const longName = "a".repeat(101);
    const result = await updateOrganizationNameAction(
      initialState,
      makeFormData({ organizationId: "org-123", name: longName })
    );

    expect(result).toEqual({
      data: null,
      error: "Organization name must be 100 characters or less",
    });
  });

  it("should successfully update organization name as admin", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "admin",
      userId: "user-123",
      createdAt: new Date(),
    } as any);

    vi.mocked(auth.api.updateOrganization).mockResolvedValue({} as any);

    const result = await updateOrganizationNameAction(
      initialState,
      makeFormData({ organizationId: "org-123", name: "New Name" })
    );

    expect(result).toEqual({
      data: { success: true },
      error: null,
    });

    expect(auth.api.updateOrganization).toHaveBeenCalledWith({
      body: { data: { name: "New Name" }, organizationId: "org-123" },
      headers: expect.any(Headers),
    });
  });

  it("should successfully update organization name as owner", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "owner",
      userId: "user-123",
      createdAt: new Date(),
    } as any);

    vi.mocked(auth.api.updateOrganization).mockResolvedValue({} as any);

    const result = await updateOrganizationNameAction(
      initialState,
      makeFormData({ organizationId: "org-123", name: "Updated Org" })
    );

    expect(result).toEqual({
      data: { success: true },
      error: null,
    });

    expect(auth.api.updateOrganization).toHaveBeenCalledWith({
      body: { data: { name: "Updated Org" }, organizationId: "org-123" },
      headers: expect.any(Headers),
    });
  });

  it("should trim whitespace from name before saving", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "admin",
      userId: "user-123",
      createdAt: new Date(),
    } as any);

    vi.mocked(auth.api.updateOrganization).mockResolvedValue({} as any);

    const result = await updateOrganizationNameAction(
      initialState,
      makeFormData({ organizationId: "org-123", name: "  Trimmed Name  " })
    );

    expect(result).toEqual({
      data: { success: true },
      error: null,
    });

    expect(auth.api.updateOrganization).toHaveBeenCalledWith({
      body: { data: { name: "Trimmed Name" }, organizationId: "org-123" },
      headers: expect.any(Headers),
    });
  });

  it("should return error if updateOrganization throws", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "owner",
      userId: "user-123",
      createdAt: new Date(),
    } as any);

    vi.mocked(auth.api.updateOrganization).mockRejectedValue(new Error("Network error"));

    const result = await updateOrganizationNameAction(
      initialState,
      makeFormData({ organizationId: "org-123", name: "New Name" })
    );

    expect(result).toEqual({
      data: null,
      error: "Network error",
    });
  });

  it("should return generic error if non-Error is thrown", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "owner",
      userId: "user-123",
      createdAt: new Date(),
    } as any);

    vi.mocked(auth.api.updateOrganization).mockRejectedValue("unknown error");

    const result = await updateOrganizationNameAction(
      initialState,
      makeFormData({ organizationId: "org-123", name: "New Name" })
    );

    expect(result).toEqual({
      data: null,
      error: "Failed to update organization name",
    });
  });

  it("should accept a name exactly 100 characters long", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "admin",
      userId: "user-123",
      createdAt: new Date(),
    } as any);

    vi.mocked(auth.api.updateOrganization).mockResolvedValue({} as any);

    const exactName = "a".repeat(100);
    const result = await updateOrganizationNameAction(
      initialState,
      makeFormData({ organizationId: "org-123", name: exactName })
    );

    expect(result).toEqual({
      data: { success: true },
      error: null,
    });
  });
});

describe("updateCoprFallbackAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "admin",
      userId: "user-123",
      createdAt: new Date(),
    } as any);
    vi.mocked(auth.api.hasPermission).mockResolvedValue({ success: true } as any);
    vi.mocked(auth.api.getFullOrganization).mockResolvedValue({
      id: "org-123",
      name: "YETI",
      slug: "yeti",
      metadata: { existingSetting: "preserved" },
    } as any);
    vi.mocked(auth.api.updateOrganization).mockResolvedValue({} as any);
  });

  it("enables fallback while preserving other metadata", async () => {
    const result = await updateCoprFallbackAction(
      initialState,
      makeFormData({ organizationId: "org-123", coprFallbackEnabled: "true" })
    );

    expect(result).toEqual({ data: { success: true }, error: null });
    expect(auth.api.updateOrganization).toHaveBeenCalledWith({
      body: {
        organizationId: "org-123",
        data: {
          metadata: {
            existingSetting: "preserved",
            coprFallbackEnabled: true,
          },
        },
      },
      headers: expect.any(Headers),
    });
  });

  it("disables fallback while preserving other metadata", async () => {
    const result = await updateCoprFallbackAction(
      initialState,
      makeFormData({ organizationId: "org-123", coprFallbackEnabled: "false" })
    );

    expect(result).toEqual({ data: { success: true }, error: null });
    expect(auth.api.updateOrganization).toHaveBeenCalledWith({
      body: {
        organizationId: "org-123",
        data: {
          metadata: {
            existingSetting: "preserved",
            coprFallbackEnabled: false,
          },
        },
      },
      headers: expect.any(Headers),
    });
  });

  it("rejects an update for a different organization", async () => {
    const result = await updateCoprFallbackAction(
      initialState,
      makeFormData({ organizationId: "org-other", coprFallbackEnabled: "true" })
    );

    expect(result).toEqual({
      data: null,
      error: "Only organization admins and owners can update settings",
    });
    expect(auth.api.hasPermission).not.toHaveBeenCalled();
    expect(auth.api.updateOrganization).not.toHaveBeenCalled();
  });

  it("rejects a member without organization update permission", async () => {
    vi.mocked(auth.api.hasPermission).mockResolvedValue({ success: false } as any);

    const result = await updateCoprFallbackAction(
      initialState,
      makeFormData({ organizationId: "org-123", coprFallbackEnabled: "true" })
    );

    expect(result).toEqual({
      data: null,
      error: "Only organization admins and owners can update settings",
    });
    expect(auth.api.updateOrganization).not.toHaveBeenCalled();
  });
});
