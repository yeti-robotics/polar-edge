import { passkeyClient } from "@better-auth/passkey/client";
import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, admin, memberRole, owner, scoutLead } from "@/lib/access-control";

/**
 * Note: this is a client-side auth client. It should not be used in server components.
 */
export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      ac,
      roles: { member: memberRole, scout_lead: scoutLead, admin, owner },
    }),
    passkeyClient(),
  ],
});
