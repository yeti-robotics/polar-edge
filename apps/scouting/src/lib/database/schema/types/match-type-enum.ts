import { pgEnum } from "drizzle-orm/pg-core";

export const matchTypeEnum = pgEnum("match_type", ["qm", "ef", "qf", "sf", "f"]);
