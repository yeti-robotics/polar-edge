import type { pitForm } from "@/lib/database/schema";
import type { PitFormValues } from "./types";

export function buildPitFormInsertData(
  validated: PitFormValues,
  scoutMemberId: string
): typeof pitForm.$inferInsert {
  return {
    teamNumber: validated.teamNumber,
    drivetrainType: validated.drivetrainType,
    drivetrainOther: "",
    archetype: validated.archetype,
    canTrench: validated.canTrench ?? false,
    canBump: validated.canBump ?? false,
    canShuttle: validated.canShuttle ?? false,
    capacity: validated.capacity,
    weight: validated.weight,
    climbType: validated.climbType === "none" ? null : validated.climbType,
    shooterType: validated.shooterType === "" ? null : validated.shooterType,
    canShootWhileMoving: validated.canShootWhileMoving ?? false,
    comments: validated.comments,
    scoutMemberId,
  };
}
