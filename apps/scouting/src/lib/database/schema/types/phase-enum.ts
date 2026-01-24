import { pgEnum } from "drizzle-orm/pg-core";

export const phaseEnum = pgEnum("phase", ["auto", "teleop"]);
