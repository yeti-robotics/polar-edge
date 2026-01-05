import { auth } from "./auth";

import { UserRole, userRoleOrdering } from "@/lib/database/schema";
import { redirect } from "next/navigation";
import { Session } from "next-auth";
import { DiscordProfile } from "next-auth/providers/discord";

const YETI_GUILD_ID = "408711970305474560";
const AVALANCHE_GUILD_ID = "1241008226598649886";

export const getImgFromProfile = (profile: DiscordProfile): string => {
	if (profile.avatar === null) {
		const defaultAvatarNumber =
			profile.discriminator === "0"
				? Number(BigInt(profile.id) >> BigInt(22)) % 6
				: parseInt(profile.discriminator) % 5;
		return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
	} else {
		const format = profile.avatar.startsWith("a_") ? "gif" : "png";
		return `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
	}
};

async function getMemberInfo(guildId: string, accessToken: string) {
	try {
		const response = await fetch(
			`https://discord.com/api/users/@me/guilds/${guildId}/member`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		if (!response.ok) {
			return null;
		}

		return await response.json();
	} catch (error) {
		console.error(
			`Failed to fetch member info for guild ${guildId}:`,
			error
		);
		return null;
	}
}

export async function getGuildNickname(accessToken: string) {
	const yetiMember = await getMemberInfo(YETI_GUILD_ID, accessToken);
	if (yetiMember?.nick) {
		return yetiMember.nick;
	}

	const avalancheMember = await getMemberInfo(
		AVALANCHE_GUILD_ID,
		accessToken
	);
	if (avalancheMember?.nick) {
		return avalancheMember.nick;
	}
	return null;
}

export enum AuthErrors {
	DISCORD_UNVERIFIED = "DISCORD_UNVERIFIED",
	BANISHED = "BANISHED",
	LOGIN_FAILED = "LOGIN_FAILED",
	NO_GUILD_NICKNAME = "NO_GUILD_NICKNAME",
	UNAUTHORIZED = "UNAUTHORIZED",
}

export const errorExplanations: Record<string, string> = {
	[AuthErrors.BANISHED]: "You have been banned.",
	[AuthErrors.DISCORD_UNVERIFIED]:
		"Your Discord account is unverified. Please verify your email and try again.",
	[AuthErrors.NO_GUILD_NICKNAME]:
		"You must have a guild nickname. Update your nickname in the Discord server to your full name and try again.",
};

export function redirectError(error: AuthErrors) {
	redirect(`/error?error=${error}`);
}

function roleIndex(userRole: UserRole) {
	return userRoleOrdering.indexOf(userRole);
}

export function isSessionAuthorized(
	requiredRole: UserRole,
	session: Session | null
) {
	if (!session) {
		return false;
	}

	return (
		session.user.role &&
		session.user.role !== UserRole.BANISHED &&
		roleIndex(session.user.role) <= roleIndex(requiredRole)
	);
}

export async function checkSession(
	requiredRole: UserRole,
	session?: Session | undefined | null
) {
	if (!session) {
		session = await auth();
	}

	if (session?.user.role === UserRole.BANISHED) {
		redirectError(AuthErrors.BANISHED);
	}

	if (!session?.user.role || !isSessionAuthorized(requiredRole, session)) {
		redirectError(
			session?.user.role === UserRole.BANISHED
				? AuthErrors.BANISHED
				: AuthErrors.UNAUTHORIZED
		);
	}
}
