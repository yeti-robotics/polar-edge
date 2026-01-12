"use client";

import { Button } from "@repo/ui/components/button";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { revokeInviteLink } from "./actions";

interface RevokeButtonProps {
  token: string;
}

export function RevokeButton({ token }: RevokeButtonProps) {
  const [isRevoking, setIsRevoking] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleRevoke() {
    if (!confirm("Are you sure you want to revoke this invite link? It will no longer work.")) {
      return;
    }

    setIsRevoking(true);

    try {
      const result = await revokeInviteLink(token);

      if (result.error) {
        alert(result.error);
        setIsRevoking(false);
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      alert("An unexpected error occurred. Please try again.");
      setIsRevoking(false);
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleRevoke}
      disabled={isRevoking || isPending}
    >
      <Trash2Icon className="mr-2 size-4" />
      {isRevoking ? "Revoking..." : "Revoke"}
    </Button>
  );
}
