import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Note: this is a client-side auth client. It should not be used in server components.
 */
export const authClient = createAuthClient({
  plugins: [organizationClient()],
});
