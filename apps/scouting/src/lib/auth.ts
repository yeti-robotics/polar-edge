import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { db } from "@/lib/database";

const url = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : (process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`);
const hostname = new URL(url).hostname;

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
  plugins: [
    organization({
      allowUserToCreateOrganization: (user) =>
        process.env.ADMIN_USERS?.split(",").includes(user.name) || false,
      // No-op email function - we use invite URLs instead
      sendInvitationEmail: async () => {
        // Invitations are handled via shareable URLs, not email
      },
    }),
    nextCookies(),
    passkey({
      rpID: hostname,
    }),
  ],
  trustedOrigins: [url],
});
