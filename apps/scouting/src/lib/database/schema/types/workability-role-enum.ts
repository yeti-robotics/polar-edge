import { pgEnum } from "drizzle-orm/pg-core";

export const workabilityRoleEnum = pgEnum("workability_role", ["driver", "human_player"]);
