"use client";

import { DropdownMenuItem } from "@repo/ui/components/dropdown-menu";
import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.refresh();
  }

  return (
    <DropdownMenuItem variant="destructive" onClick={handleLogout}>
      <LogOutIcon className="size-4 text-current" />
      <span>Logout</span>
    </DropdownMenuItem>
  );
}
