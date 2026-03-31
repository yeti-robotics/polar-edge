import { pgEnum } from "drizzle-orm/pg-core";

export const shooterTypeEnum = pgEnum("shooter_type", ["turret", "fixed"]);
