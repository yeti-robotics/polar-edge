import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { member, organizationInviteLink } from "@/lib/database/schema/tables";

function generateId(): string {
  return randomBytes(16).toString("hex");
}

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function generateInviteLink() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });

  if (!activeMember || (activeMember.role !== "admin" && activeMember.role !== "owner")) {
    throw new Error("Only admins and owners can generate invite links");
  }

  const token = generateToken();
  const inviteLink = await db
    .insert(organizationInviteLink)
    .values({
      id: generateId(),
      token,
      organizationId: activeMember.organizationId,
      createdById: session.user.id,
      revoked: false,
    })
    .returning();

  return inviteLink[0];
}

export async function listInviteLinks() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });

  if (!activeMember || (activeMember.role !== "admin" && activeMember.role !== "owner")) {
    throw new Error("Only admins and owners can view invite links");
  }

  const links = await db
    .select()
    .from(organizationInviteLink)
    .where(eq(organizationInviteLink.organizationId, activeMember.organizationId))
    .orderBy(organizationInviteLink.createdAt);

  return links;
}

export async function revokeInviteLink(token: string) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });

  if (!activeMember || (activeMember.role !== "admin" && activeMember.role !== "owner")) {
    throw new Error("Only admins and owners can revoke invite links");
  }

  // Verify the invite link belongs to the active organization
  const inviteLink = await db
    .select()
    .from(organizationInviteLink)
    .where(
      and(
        eq(organizationInviteLink.token, token),
        eq(organizationInviteLink.organizationId, activeMember.organizationId)
      )
    )
    .limit(1);

  if (!inviteLink[0]) {
    throw new Error("Invite link not found");
  }

  await db
    .update(organizationInviteLink)
    .set({ revoked: true })
    .where(eq(organizationInviteLink.token, token));

  return { success: true };
}

export async function getInviteLinkByToken(token: string) {
  const inviteLink = await db
    .select()
    .from(organizationInviteLink)
    .where(eq(organizationInviteLink.token, token))
    .limit(1);

  return inviteLink[0] || null;
}

export async function acceptInviteLink(token: string) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session?.user) {
    throw new Error("You must be signed in to accept an invite");
  }

  const inviteLink = await getInviteLinkByToken(token);

  if (!inviteLink) {
    throw new Error("Invalid invite link");
  }

  if (inviteLink.revoked) {
    throw new Error("This invite link has been revoked");
  }

  // Check if user is already a member
  const existingMember = await db
    .select()
    .from(member)
    .where(
      and(eq(member.organizationId, inviteLink.organizationId), eq(member.userId, session.user.id))
    )
    .limit(1);

  if (existingMember[0]) {
    throw new Error("You are already a member of this organization");
  }

  // Add user to organization as a member
  await db.insert(member).values({
    id: generateId(),
    organizationId: inviteLink.organizationId,
    userId: session.user.id,
    role: "member",
    createdAt: new Date(),
  });

  return { success: true };
}
