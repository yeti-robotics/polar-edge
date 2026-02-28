"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function useLeaveOrganization(organizationId?: string) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function leave() {
    if (!organizationId) return;

    setIsLeaving(true);
    setError(null);

    const { error } = await authClient.organization.leave({
      organizationId,
    });

    if (error) {
      setError(error.message ?? "Something went wrong. Please try again.");
      setIsLeaving(false);
      return;
    }

    const { data: orgs } = await authClient.organization.list();

    if (!orgs || orgs.length === 0) {
      await authClient.deleteUser();
      await authClient.signOut();
      router.push("/");
      return;
    }

    setIsLeaving(false);
    router.push("/");
  }

  return { leave, isLeaving, error, setError } as const;
}
