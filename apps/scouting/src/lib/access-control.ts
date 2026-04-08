import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

/**
 * Extend Better Auth's default organization statements with app-specific resources.
 */
export const statement = {
  ...defaultStatements,
  event: ["sync", "activate"],
  driveRanking: ["create", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

/** Member: no administrative permissions */
export const memberRole = ac.newRole({
  organization: [],
  member: [],
  invitation: [],
  team: [],
  ac: ["read"],
  event: [],
  driveRanking: [],
});

/** Scouting Lead: can submit drive team rankings, no org management */
export const scoutLead = ac.newRole({
  organization: [],
  member: [],
  invitation: [],
  team: [],
  ac: ["read"],
  event: [],
  driveRanking: ["create", "update", "delete"],
});

/** Admin: can manage members, invitations, org settings, and events */
export const admin = ac.newRole({
  organization: ["update"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  team: ["create", "update", "delete"],
  ac: ["create", "read", "update", "delete"],
  event: ["sync", "activate"],
  driveRanking: ["create", "update", "delete"],
});

/** Owner: same as admin plus org deletion */
export const owner = ac.newRole({
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  team: ["create", "update", "delete"],
  ac: ["create", "read", "update", "delete"],
  event: ["sync", "activate"],
  driveRanking: ["create", "update", "delete"],
});
