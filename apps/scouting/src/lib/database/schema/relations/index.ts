import { relations } from "drizzle-orm";
import { account } from "../tables/account";
import { invitation } from "../tables/invitation";
import { member } from "../tables/member";
import { organization } from "../tables/organization";
import { organizationInviteLink } from "../tables/organization-invite-link";
import { session } from "../tables/session";
import { user } from "../tables/user";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
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
