import "next-auth";
import { UserRole } from "@/lib/database/schema";

declare module "next-auth" {
	interface User {
		role: UserRole;
		guildNickname: string | null;
		emailVerified: Date | null;
	}

	interface Session {
		user: {
			id: string;
			name: string;
			guildNickname: string | null;
			role: UserRole;
			image: string;
		};
	}

	interface Profile {
		guildNickname: string;
		image_url: string;
	}
}
