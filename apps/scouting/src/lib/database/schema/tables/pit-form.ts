import { boolean, pgTable, smallint, timestamp, uuid } from "drizzle-orm/pg-core";
import { climbTypeEnum } from "../types/climb-type-enum";
import { drivetrainEnum } from "../types/drivetrain-enum";
import { member } from "./member";

export const pitForm = pgTable("pit_form", {
  id: uuid("id").primaryKey().defaultRandom(),

  scoutMemberId: uuid("scout_member_id").references(() => member.id),

  drivetrainType: drivetrainEnum("drivetrain").notNull(),

  canTrench: boolean("can_trench").notNull().default(false),
  canBump: boolean("can_bump").notNull().default(false),
  canShuttle: boolean("can_shuttle").notNull().default(false),

  capacity: smallint("capacity").notNull().default(0),
  weight: smallint("weight").notNull().default(0),

  climbType: climbTypeEnum("climb_type"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
