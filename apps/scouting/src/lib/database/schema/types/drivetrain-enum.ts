import { pgEnum } from "drizzle-orm/pg-core";

export const drivetrainEnum = pgEnum("drivetrain", ["tank", "swerve", "mecanum", "other"]);
