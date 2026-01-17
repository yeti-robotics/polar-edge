import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { user } from "./user";

export const organizationInviteLink = pgTable(
  "organization_invite_link",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    revoked: boolean("revoked").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("organization_invite_link_organizationId_idx").on(table.organizationId),
    index("organization_invite_link_token_idx").on(table.token),
  ]
);
