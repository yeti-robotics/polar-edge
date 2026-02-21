"use client";

import { Button } from "@repo/ui/components/button";
import { authClient } from "@/lib/auth-client";

export default function LogoutButton() {
  function handleLogOut() {
    authClient.signOut();
  }

  return <Button onClick={handleLogOut}>Log Out</Button>;
}
