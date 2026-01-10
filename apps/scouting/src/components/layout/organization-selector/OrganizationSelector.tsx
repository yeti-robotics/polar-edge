import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { OrganizationSelectorClient } from "./OrganizationSelectorClient";

export async function OrganizationSelector() {
  const [session, userOrganizations] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    auth.api.listOrganizations({ headers: await headers() }),
  ]);

  if (!session?.user) {
    return null;
  }

  const superAdmin = isSuperAdmin(session.user.name);

  const organizations = (userOrganizations ?? []).map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    logo: org.logo,
  }));

  return (
    <OrganizationSelectorClient
      organizations={organizations}
      activeOrganizationId={session.session.activeOrganizationId}
      isSuperAdmin={superAdmin}
    />
  );
}
