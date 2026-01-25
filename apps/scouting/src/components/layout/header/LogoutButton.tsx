"use client";

import { DropdownMenuItem } from "@repo/ui/components/dropdown-menu";
import { LogOutIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  function handleLogout() {
    authClient.signOut();
  }

  return (
    <DropdownMenuItem variant="destructive" onClick={handleLogout}>
      <LogOutIcon className="size-4 text-current" />
      <span>Logout</span>
    </DropdownMenuItem>
  );
}
