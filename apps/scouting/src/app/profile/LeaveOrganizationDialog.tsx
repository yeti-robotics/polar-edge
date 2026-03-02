"use client";

import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
// using simple divs inside DialogDescription to avoid nested <p> issues
import { useState } from "react";
import { useLeaveOrganization } from "@/features/org/hooks/useLeaveOrganization";

type Props = {
  organizationId?: string;
};

export default function LeaveOrganizationDialog({ organizationId }: Props) {
  const [open, setOpen] = useState(false);
  const { leave, isLeaving, error } = useLeaveOrganization(organizationId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Leave Organization</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave Organization?</DialogTitle>
          <DialogDescription>
            <div className="text-sm leading-7 not-first:mt-2">
              Leaving will revoke access to all data.
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2">
          <Button variant="destructive" onClick={leave} disabled={isLeaving}>
            {isLeaving ? "Leaving..." : "Confirm"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
