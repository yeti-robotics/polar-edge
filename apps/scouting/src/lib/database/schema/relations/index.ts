import { relations } from "drizzle-orm";
import { account } from "../tables/account";
import { event } from "../tables/event";
import { invitation } from "../tables/invitation";
import { member } from "../tables/member";
import { organization } from "../tables/organization";
import { organizationEvent } from "../tables/organization-event";
import { organizationInviteLink } from "../tables/organization-invite-link";
import { passkey } from "../tables/passkey";
import { session } from "../tables/session";
import { user } from "../tables/user";

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
