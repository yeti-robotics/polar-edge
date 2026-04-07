"use client";

import { Button } from "@repo/ui/components/button";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function ProfileLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.refresh();
  }

  return <Button onClick={handleLogout}>Log Out</Button>;
}
