import { randomBytes } from "node:crypto";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { and, eq, isNull } from "drizzle-orm";
import { ac, admin, memberRole, owner } from "@/lib/access-control";
import { db } from "@/lib/database";
import { member } from "@/lib/database/schema/tables/member";
import { session } from "@/lib/database/schema/tables/session";
import { user as userTable } from "@/lib/database/schema/tables/user";
import { isSuperAdmin } from "@/lib/permissions";
import { getInviteLinkByToken } from "@/lib/server/invite-links";

const PENDING_INVITE_COOKIE = "pending_invite_token";
const NEW_USER_WINDOW_MS = 60_000; // 1 minute

const betterAuthUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const hostname = new URL(betterAuthUrl).hostname;

async function getInitialOrganization(userId: string) {
  const user = await db.query.user.findFirst({
    where: eq(userTable.id, userId),
    with: {
      members: {
        with: {
          organization: true,
        },
      },
    },
  });

  return user?.members[0]?.organization;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: { enabled: false },
  socialProviders: {
    discord: {
      // biome-ignore lint/style/noNonNullAssertion: temp
      clientId: process.env.DISCORD_CLIENT_ID!,
      // biome-ignore lint/style/noNonNullAssertion: temp
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const newSession = ctx.context.newSession;
      if (!newSession?.user || !ctx.path.startsWith("/callback/")) {
        return;
      }

      const userId = newSession.user.id;
      const user = await db.query.user.findFirst({
        where: eq(userTable.id, userId),
      });

      if (!user) return;

      const createdAt = user.createdAt.getTime();
      const isNewUser = Date.now() - createdAt < NEW_USER_WINDOW_MS;

      if (isNewUser) {
        const inviteToken = ctx.getCookie(PENDING_INVITE_COOKIE);
        const inviteLink = inviteToken ? await getInviteLinkByToken(inviteToken) : null;
        const allowed = isSuperAdmin(user.email) || (inviteLink !== null && !inviteLink.revoked);

        if (allowed) {
          ctx.setCookie(PENDING_INVITE_COOKIE, "", { maxAge: 0, path: "/" });

          // Auto-accept the invite: add user to the org and set it as active
          if (inviteLink && !inviteLink.revoked) {
            const existingMember = await db
              .select()
              .from(member)
              .where(
                and(eq(member.organizationId, inviteLink.organizationId), eq(member.userId, userId))
              )
              .limit(1);

            if (!existingMember[0]) {
              await db.insert(member).values({
                id: randomBytes(16).toString("hex"),
                organizationId: inviteLink.organizationId,
                userId,
                role: "member",
                createdAt: new Date(),
              });
            }

            // Set the new org as active on the session so pages don't error
            if (newSession.session?.id) {
              await db
                .update(session)
                .set({ activeOrganizationId: inviteLink.organizationId })
                .where(eq(session.id, newSession.session.id));
            }
          }

          return;
        }

        await db.delete(userTable).where(eq(userTable.id, userId));
        ctx.setCookie(PENDING_INVITE_COOKIE, "", { maxAge: 0, path: "/" });
        const sessionCookieName = ctx.context.authCookies?.sessionToken?.name;
        if (sessionCookieName) {
          ctx.setCookie(sessionCookieName, "", { maxAge: 0, path: "/" });
        }
        throw ctx.redirect("/?signup=restricted");
      }

      // For returning users: restore active org on the new session if it isn't set.
      // Better Auth creates sessions with activeOrganizationId = null, so without this
      // getActiveMember returns null on the first request after sign-in.
      if (newSession.session?.id) {
        const firstMembership = await db.query.member.findFirst({
          where: eq(member.userId, userId),
          orderBy: (m, { asc }) => [asc(m.createdAt)],
        });
        if (firstMembership) {
          await db
            .update(session)
            .set({ activeOrganizationId: firstMembership.organizationId })
            .where(
              and(eq(session.id, newSession.session.id), isNull(session.activeOrganizationId))
            );
        }
      }
    }),
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const organization = await getInitialOrganization(session.userId);
          return {
            data: {
              ...session,
              activeOrganizationId: organization?.id,
            },
          };
        },
      },
    },
  },
  plugins: [
    organization({
      ac,
      roles: {
        member: memberRole,
        admin,
        owner,
      },
      allowUserToCreateOrganization: (user) => isSuperAdmin(user.email) || false,
      // No-op email function - we use invite URLs instead
      sendInvitationEmail: async () => {
        // Invitations are handled via shareable URLs, not email
      },
    }),
    passkey({
      rpID: hostname,
    }),
    nextCookies(),
  ],
  trustedOrigins: () => {
    if (process.env.NODE_ENV === "production") {
      // biome-ignore lint/style/noNonNullAssertion: production better-auth url is required
      return [process.env.BETTER_AUTH_URL!];
    }
    return ["http://localhost:3000"];
  },
});
