import {
  boolean,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { climbTypeEnum } from "../types/climb-type-enum";
import { drivetrainEnum } from "../types/drivetrain-enum";
import { member } from "./member";
import { team } from "./team";

export const pitForm = pgTable(
  "pit_form",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    scoutMemberId: text("scout_member_id").references(() => member.id, { onDelete: "set null" }),
    teamNumber: integer("team_number")
      .notNull()
      .references(() => team.teamNumber),

    drivetrainType: drivetrainEnum("drivetrain").notNull(),

    canTrench: boolean("can_trench").notNull().default(false),
    canBump: boolean("can_bump").notNull().default(false),
    canShuttle: boolean("can_shuttle").notNull().default(false),

    capacity: smallint("capacity").notNull().default(0),
    weight: smallint("weight").notNull().default(0),

    climbType: climbTypeEnum("climb_type"),
    comments: text("comments").notNull().default(""),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_pit_form_team_number").on(t.teamNumber),
    index("idx_pit_form_scout_member").on(t.scoutMemberId),
  ]
);
