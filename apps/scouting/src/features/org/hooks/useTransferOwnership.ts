"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function useTransferOwnership(organizationId?: string) {
  const router = useRouter();
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function transfer(userId?: string) {
    if (!organizationId || !userId) return;

    setIsTransferring(true);
    setError(null);

    const { error } = await (authClient.organization.updateMemberRole as any)({
      organizationId,
      userId,
      role: "owner",
    });

    if (error) {
      setError(error.message ?? "Transfer failed. Please try again.");
      setIsTransferring(false);
      return;
    }

    setIsTransferring(false);
    router.refresh();
  }

  return { transfer, isTransferring, error, setError } as const;
}
