import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function listOrganizationMembers(organizationId: string) {
  const headerList = await headers();

  const members = await auth.api.listMembers({
    headers: headerList,
    query: {
      organizationId,
    },
  });

  return members;
}
