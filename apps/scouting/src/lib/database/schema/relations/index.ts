import { relations } from "drizzle-orm";
import { account } from "../tables/account";
import { event } from "../tables/event";
import { invitation } from "../tables/invitation";
import { member } from "../tables/member";
import { organization } from "../tables/organization";
import { organizationEvent } from "../tables/organization-event";
import { organizationInviteLink } from "../tables/organization-invite-link";
import { passkey } from "../tables/passkey";
import { picklist } from "../tables/picklist";
import { picklistTeam } from "../tables/picklist-team";
import { pitForm } from "../tables/pit-form";
import { pitPhoto } from "../tables/pit-photo";
import { session } from "../tables/session";
import { team } from "../tables/team";
import { user } from "../tables/user";
import { workabilityForm } from "../tables/workability-form";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
  passkeys: many(passkey),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
  inviteLinks: many(organizationInviteLink),
  organizationEvents: many(organizationEvent),
  picklists: many(picklist),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export const organizationInviteLinkRelations = relations(organizationInviteLink, ({ one }) => ({
  organization: one(organization, {
    fields: [organizationInviteLink.organizationId],
    references: [organization.id],
  }),
  createdBy: one(user, {
    fields: [organizationInviteLink.createdById],
    references: [user.id],
  }),
}));

export const organizationEventRelations = relations(organizationEvent, ({ one }) => ({
  organization: one(organization, {
    fields: [organizationEvent.organizationId],
    references: [organization.id],
  }),
  event: one(event, {
    fields: [organizationEvent.eventId],
    references: [event.id],
  }),
}));

export const passkeyRelations = relations(passkey, ({ one }) => ({
  user: one(user, {
    fields: [passkey.userId],
    references: [user.id],
  }),
}));

export const pitFormRelations = relations(pitForm, ({ many }) => ({
  photos: many(pitPhoto),
}));

export const pitPhotoRelations = relations(pitPhoto, ({ one }) => ({
  pitForm: one(pitForm, {
    fields: [pitPhoto.pitFormId],
    references: [pitForm.id],
  }),
}));

export const picklistRelations = relations(picklist, ({ one, many }) => ({
  organization: one(organization, {
    fields: [picklist.organizationId],
    references: [organization.id],
  }),
  event: one(event, {
    fields: [picklist.eventId],
    references: [event.id],
  }),
  createdBy: one(member, {
    fields: [picklist.createdByMemberId],
    references: [member.id],
  }),
  teams: many(picklistTeam),
}));

export const picklistTeamRelations = relations(picklistTeam, ({ one }) => ({
  picklist: one(picklist, {
    fields: [picklistTeam.picklistId],
    references: [picklist.id],
  }),
  team: one(team, {
    fields: [picklistTeam.teamNumber],
    references: [team.teamNumber],
  }),
}));

export const workabilityFormRelations = relations(workabilityForm, ({ one }) => ({
  event: one(event, {
    fields: [workabilityForm.eventId],
    references: [event.id],
  }),
  member: one(member, {
    fields: [workabilityForm.scoutMemberId],
    references: [member.id],
  }),
  team: one(team, {
    fields: [workabilityForm.teamNumber],
    references: [team.teamNumber],
  }),
}));
