import { pgEnum } from "drizzle-orm/pg-core";

export const allianceEnum = pgEnum("alliance", ["red", "blue"]);
