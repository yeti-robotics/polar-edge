import { AuthErrors, getGuildNickname, getImgFromProfile } from "./utils";

import { db } from "@/lib/database";
import {
	accounts,
	authenticators,
	sessions,
	UserRole,
	users,
	verificationTokens,
} from "@/lib/database/schema";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import { Adapter } from "next-auth/adapters";
import Discord from "next-auth/providers/discord";

const scopes = ["identify", "email", "guilds.members.read"];
const errorPage = "/error";

export const redirectToErrorPage = (error: AuthErrors) => {
	return `${errorPage}?error=${error}`;
};

class AuthErrorsCustomError extends Error {
	constructor(error: AuthErrors) {
		super(error);
	}
}

export const discordProvider = Discord({
	authorization: `https://discord.com/api/oauth2/authorize?scope=${scopes.join("+")}`,
	clientId: process.env.AUTH_DISCORD_ID,
	clientSecret: process.env.AUTH_DISCORD_SECRET,

	profile: async (discordProfile, token) => {
		let guildNickname;

		if (token.access_token) {
			guildNickname = await getGuildNickname(token.access_token);
			discordProfile.guildNickname = guildNickname;
			discordProfile.image_url = getImgFromProfile(discordProfile);
		}

		return {
			id: discordProfile.id,
			name: discordProfile.username,
			role: UserRole.USER,
			guildNickname: guildNickname ?? "",
			email: discordProfile.email,
			image: discordProfile.image_url,
			emailVerified: discordProfile.verified ? new Date() : null,
		};
	},
});

export const providers = {
	discord: discordProvider.id,
};

const authenticationProvider = NextAuth({
	trustHost: true,
	providers: [discordProvider],
	pages: {
		signIn: "/",
		error: "/error", // Error code passed in query string as ?error=
		newUser: "/scout", // If set, new users will be directed here on first sign in
	},
	session: {
		strategy: "database",
		maxAge: 3 * 24 * 60 * 60, // 3 days
	},
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationTokens,
		authenticatorsTable: authenticators,
	}) as Adapter,
	callbacks: {
		async session({ session, user }) {
			if (session.user) {
				session.user.emailVerified = user.emailVerified;
				session.user.id = user.id;
				session.user.role = user.role;
				session.user.guildNickname = user.guildNickname;
			}

			return session;
		},
		async signIn({ user, account, profile }) {
			if (account?.provider === "discord") {
				const guildNickname = profile?.guildNickname;

				try {
					if (!account?.access_token) {
						console.warn("Login rejected due to no access token");
						throw new AuthErrorsCustomError(
							AuthErrors.LOGIN_FAILED
						);
					}
					if (!user.id || user.role === UserRole.BANISHED) {
						console.warn("Login rejected due to banished user");
						throw new AuthErrorsCustomError(AuthErrors.BANISHED);
					}
					if (!guildNickname) {
						console.warn("Login rejected due to no guild nickname");
						throw new AuthErrorsCustomError(
							AuthErrors.NO_GUILD_NICKNAME
						);
					}

					if (
						process.env.ADMIN_USERS?.split(",").includes(
							profile.username as string
						)
					) {
						profile.role = UserRole.ADMIN;
					}

					try {
						await db
							.update(users)
							.set({
								guildNickname: profile?.guildNickname,
								role: profile?.role ?? UserRole.USER,
								image: profile?.image_url as string,
								emailVerified: profile?.verified
									? new Date()
									: null,
							})
							.where(eq(users.id, user.id));
					} catch (error) {
						console.error(error);
						throw new AuthErrorsCustomError(
							AuthErrors.LOGIN_FAILED
						);
					}
				} catch (err) {
					if (err instanceof AuthErrorsCustomError) {
						return redirectToErrorPage(err.message as AuthErrors);
					}

					throw err;
				}
			}

			return true;
		},
	},
});

export const { handlers, signIn, signOut, auth } = authenticationProvider;

declare module "next-auth" {
	interface User {
		role: UserRole;
		guildNickname: string | null;
		emailVerified: Date | null;
	}

	interface Profile {
		role: UserRole;
		guildNickname: string;
		image_url: string;
	}
}
