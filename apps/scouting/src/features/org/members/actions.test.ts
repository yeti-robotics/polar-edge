/** biome-ignore-all lint/suspicious/noExplicitAny: this is a test file, so we can use any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { member } from "@/lib/database/schema/tables/member";
import { session } from "@/lib/database/schema/tables/session";
import { user } from "@/lib/database/schema/tables/user";
import { removeMember } from "./actions";

// Mock modules
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getActiveMember: vi.fn(),
      hasPermission: vi.fn(),
    },
  },
}));

vi.mock("@/lib/database", () => ({
  db: {
    query: {
      member: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    transaction: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

describe("removeMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.api.hasPermission).mockResolvedValue({ success: true } as any);
  });

  it("should return error if not authenticated", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue(null as any);

    const result = await removeMember("member-123");

    expect(result).toEqual({
      data: null,
      error: "Not authenticated",
    });
  });

  it("should return error if user is not admin or owner", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "member",
      userId: "user-123",
      createdAt: new Date(),
    } as any);
    vi.mocked(auth.api.hasPermission).mockResolvedValue({ success: false } as any);

    const result = await removeMember("member-456");

    expect(result).toEqual({
      data: null,
      error: "You do not have permission to remove members",
    });
  });

  it("should return error if member not found", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "owner",
      userId: "user-123",
      createdAt: new Date(),
    } as any);

    vi.mocked(db.query.member.findFirst).mockResolvedValue(undefined);

    const result = await removeMember("member-456");

    expect(result).toEqual({
      data: null,
      error: "Member not found",
    });
  });

  it("should return error if member is from different organization", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "owner",
      userId: "user-123",
      createdAt: new Date(),
    } as any);

    vi.mocked(db.query.member.findFirst).mockResolvedValue({
      id: "member-456",
      organizationId: "org-999",
      userId: "user-456",
      role: "member",
      createdAt: new Date(),
    });

    const result = await removeMember("member-456");

    expect(result).toEqual({
      data: null,
      error: "Member not in your organization",
    });
  });

  it("should return error when trying to remove the owner", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "owner",
      userId: "user-123",
      createdAt: new Date(),
    } as any);

    vi.mocked(db.query.member.findFirst).mockResolvedValue({
      id: "member-456",
      organizationId: "org-123",
      userId: "user-456",
      role: "owner",
      createdAt: new Date(),
    } as any);

    const result = await removeMember("member-456");

    expect(result).toEqual({
      data: null,
      error: "Cannot remove the organization owner",
    });
  });

  it("should return error when admin tries to remove another admin", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "admin",
      userId: "user-123",
      createdAt: new Date(),
    } as any);

    vi.mocked(db.query.member.findFirst).mockResolvedValue({
      id: "member-456",
      organizationId: "org-123",
      userId: "user-456",
      role: "admin",
      createdAt: new Date(),
    } as any);

    const result = await removeMember("member-456");

    expect(result).toEqual({
      data: null,
      error: "Admins cannot remove other admins",
    });
  });

  it("should return error when trying to remove self (owner gets owner error)", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "owner",
      userId: "user-123",
      createdAt: new Date(),
    } as any);

    vi.mocked(db.query.member.findFirst).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      userId: "user-123",
      role: "owner",
      createdAt: new Date(),
    } as any);

    const result = await removeMember("active-member-123");

    // Owner check happens before self-removal check
    expect(result).toEqual({
      data: null,
      error: "Cannot remove the organization owner",
    });
  });

  it("should return error when admin tries to remove self (admin gets admin error)", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "admin",
      userId: "user-123",
      createdAt: new Date(),
    } as any);

    vi.mocked(db.query.member.findFirst).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      userId: "user-123",
      role: "admin",
      createdAt: new Date(),
    });

    const result = await removeMember("active-member-123");

    // Admin check happens before self-removal check
    expect(result).toEqual({
      data: null,
      error: "Admins cannot remove other admins",
    });
  });

  it("should return error when regular member tries to remove self", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "member",
      userId: "user-123",
      createdAt: new Date(),
    } as any);
    vi.mocked(auth.api.hasPermission).mockResolvedValue({ success: false } as any);

    vi.mocked(db.query.member.findFirst).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      userId: "user-123",
      role: "member",
      createdAt: new Date(),
    } as any);

    const result = await removeMember("active-member-123");

    // Regular members don't have permission at all
    expect(result).toEqual({
      data: null,
      error: "You do not have permission to remove members",
    });
  });

  it("should successfully remove member and keep user account when they have other memberships", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "owner",
      userId: "user-123",
      createdAt: new Date(),
    } as any);

    const memberToRemove = {
      id: "member-456",
      organizationId: "org-123",
      userId: "user-456",
      role: "member",
      createdAt: new Date(),
    };

    vi.mocked(db.query.member.findFirst).mockResolvedValue(memberToRemove);

    // Mock transaction to execute callbacks
    const mockDelete = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    });

    const mockTx = {
      delete: mockDelete,
      update: mockUpdate,
      query: {
        member: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: "member-789",
              organizationId: "org-999",
              userId: "user-456",
              role: "member",
              createdAt: new Date(),
            },
          ]), // User has another membership
        },
      },
    };

    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      return callback(mockTx as any);
    });

    const result = await removeMember("member-456");

    expect(result).toEqual({
      data: { success: true },
      error: null,
    });

    // Verify member was deleted
    expect(mockDelete).toHaveBeenCalledWith(member);

    // Verify sessions were cleared
    expect(mockUpdate).toHaveBeenCalledWith(session);

    // Verify user was NOT deleted (has other memberships)
    expect(mockDelete).not.toHaveBeenCalledWith(user);
  });

  it("should successfully remove member and delete user account when they have no other memberships", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "owner",
      userId: "user-123",
      createdAt: new Date(),
    } as any);

    const memberToRemove = {
      id: "member-456",
      organizationId: "org-123",
      userId: "user-456",
      role: "member",
      createdAt: new Date(),
    };

    vi.mocked(db.query.member.findFirst).mockResolvedValue(memberToRemove);

    // Mock transaction
    const mockDelete = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    });

    const mockTx = {
      delete: mockDelete,
      update: mockUpdate,
      query: {
        member: {
          findMany: vi.fn().mockResolvedValue([]), // No other memberships
        },
      },
    };

    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      return callback(mockTx as any);
    });

    const result = await removeMember("member-456");

    expect(result).toEqual({
      data: { success: true },
      error: null,
    });

    // Verify member was deleted
    expect(mockDelete).toHaveBeenCalledWith(member);

    // Verify sessions were cleared
    expect(mockUpdate).toHaveBeenCalledWith(session);

    // Verify user WAS deleted (no other memberships)
    expect(mockDelete).toHaveBeenCalledWith(user);
  });

  it("should allow owner to remove admin", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "owner",
      userId: "user-123",
      createdAt: new Date(),
    } as any);

    const memberToRemove = {
      id: "member-456",
      organizationId: "org-123",
      userId: "user-456",
      role: "admin",
      createdAt: new Date(),
    } as any;

    vi.mocked(db.query.member.findFirst).mockResolvedValue(memberToRemove);

    const mockDelete = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    });

    const mockTx = {
      delete: mockDelete,
      update: mockUpdate,
      query: {
        member: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
    };

    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      return callback(mockTx as any);
    });

    const result = await removeMember("member-456");

    expect(result).toEqual({
      data: { success: true },
      error: null,
    });
  });

  it("should allow admin to remove regular member", async () => {
    vi.mocked(auth.api.getActiveMember).mockResolvedValue({
      id: "active-member-123",
      organizationId: "org-123",
      role: "admin",
      userId: "user-123",
      createdAt: new Date(),
    } as any);

    const memberToRemove = {
      id: "member-456",
      organizationId: "org-123",
      userId: "user-456",
      role: "member",
      createdAt: new Date(),
    } as any;

    vi.mocked(db.query.member.findFirst).mockResolvedValue(memberToRemove);

    const mockDelete = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    });

    const mockTx = {
      delete: mockDelete,
      update: mockUpdate,
      query: {
        member: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
    };

    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      return callback(mockTx as any);
    });

    const result = await removeMember("member-456");

    expect(result).toEqual({
      data: { success: true },
      error: null,
    });
  });
});
