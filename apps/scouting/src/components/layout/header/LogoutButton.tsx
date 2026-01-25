"use client";

import { DropdownMenuItem } from "@repo/ui/components/dropdown-menu";
import { LogOutIcon } from "lucide-react";
import { signOut } from "@/lib/actions/auth/sign-out";

export function LogoutButton() {
  return (
    <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
      <LogOutIcon className="size-4 text-current" aria-hidden="true" />
      <span>Logout</span>
    </DropdownMenuItem>
  );
}
