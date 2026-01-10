import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { createAuthClient } from "better-auth/react";
import { db } from "@/lib/database";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: { enabled: false },
  socialProviders: {
    discord: {
      // biome-ignore lint/style/noNonNullAssertion: temp
      clientId: process.env.AUTH_DISCORD_ID!,
      // biome-ignore lint/style/noNonNullAssertion: temp
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: (user) =>
        process.env.ADMIN_USERS?.split(",").includes(user.name) || false,
    }),
    nextCookies(),
  ],
});
