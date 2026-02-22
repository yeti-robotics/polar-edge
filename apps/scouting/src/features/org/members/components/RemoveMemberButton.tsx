"use client";

import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { removeMember } from "../actions";

interface RemoveMemberButtonProps {
  memberId: string;
  memberName: string;
}

export function RemoveMemberButton({ memberId, memberName }: RemoveMemberButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleConfirm() {
    const result = await removeMember(memberId);

    if (result.error) {
      alert(result.error);
      setIsDialogOpen(false);
      return;
    }

    setIsDialogOpen(false);
    startTransition(() => {
      router.refresh();
    });
  }

  function handleCancel() {
    setIsDialogOpen(false);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        disabled={isPending}
        className="text-destructive hover:text-destructive"
      >
        Remove
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium text-foreground">{memberName}</span> from this
              organization? Their access will be revoked immediately, but their submitted scouting
              data will be preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
              {isPending ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
