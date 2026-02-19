import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { ac, admin, memberRole, owner } from "@/lib/access-control";
import { db } from "@/lib/database";
import { user as userTable } from "@/lib/database/schema/tables/user";
import { isSuperAdmin } from "@/lib/permissions";
import { getInviteLinkByToken } from "@/lib/server/invite-links";

const PENDING_INVITE_COOKIE = "pending_invite_token";
const NEW_USER_WINDOW_MS = 60_000; // 1 minute

const hostname = new URL(process.env.BETTER_AUTH_URL!).hostname;

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
      if (!isNewUser) return;

      const allowed =
        isSuperAdmin(user.email) ||
        (await (async () => {
          const inviteToken = ctx.getCookie(PENDING_INVITE_COOKIE);
          if (!inviteToken) return false;
          const link = await getInviteLinkByToken(inviteToken);
          return link !== null && !link.revoked;
        })());

      if (allowed) {
        ctx.setCookie(PENDING_INVITE_COOKIE, "", { maxAge: 0, path: "/" });
        return;
      }

      await db.delete(userTable).where(eq(userTable.id, userId));
      ctx.setCookie(PENDING_INVITE_COOKIE, "", { maxAge: 0, path: "/" });
      const sessionCookieName = ctx.context.authCookies?.sessionToken?.name;
      if (sessionCookieName) {
        ctx.setCookie(sessionCookieName, "", { maxAge: 0, path: "/" });
      }
      throw ctx.redirect("/?signup=restricted");
    }),
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
