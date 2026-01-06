import { db } from "@/lib/database";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { createAuthClient } from "better-auth/react";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
    emailAndPassword: { enabled: false },
	socialProviders: {
		discord: {
			clientId: process.env.AUTH_DISCORD_ID!,
			clientSecret: process.env.AUTH_DISCORD_SECRET!,
		},
	},
	plugins: [organization(), nextCookies()],
});

export const authClient = createAuthClient({});
