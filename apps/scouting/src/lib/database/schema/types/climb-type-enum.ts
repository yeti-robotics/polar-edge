import { pgEnum } from "drizzle-orm/pg-core";

export const climbTypeEnum = pgEnum("climb_type", ["sides", "center", "left", "right", "any"]);
