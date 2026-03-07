import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { session } from "@/lib/database/schema";

export async function setDefaultOrganizationIfNeeded(): Promise<string | null> {
  const headerList = await headers();
  const sessionData = await auth.api.getSession({ headers: headerList });

  if (!sessionData?.user) {
    return null;
  }

  try {
    // getActiveMember throws when session has no activeOrganizationId,
    // so catch it independently to avoid aborting the fallback logic.
    const [activeMember, organizations] = await Promise.all([
      auth.api.getActiveMember({ headers: headerList }).catch(() => null),
      auth.api.listOrganizations({ headers: headerList }),
    ]);

    if (activeMember?.organizationId) {
      return activeMember.organizationId;
    }

    if (!organizations || organizations.length === 0) {
      return null;
    }

    const defaultOrganization = organizations[0];
    if (!defaultOrganization) {
      return null;
    }

    await db
      .update(session)
      .set({ activeOrganizationId: defaultOrganization.id })
      .where(and(eq(session.userId, sessionData.user.id), isNull(session.activeOrganizationId)));

    return defaultOrganization.id;
  } catch (error) {
    console.error(error);
    return null;
  }
}
