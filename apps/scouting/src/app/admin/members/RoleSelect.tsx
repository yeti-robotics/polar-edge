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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateMemberRole } from "./actions";

interface RoleSelectProps {
  memberId: string;
  memberName: string;
  currentRole: string;
}

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export function RoleSelect({ memberId, memberName, currentRole }: RoleSelectProps) {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleValueChange(newRole: string) {
    if (newRole === selectedRole) return;
    setPendingRole(newRole);
    setIsDialogOpen(true);
  }

  async function handleConfirm() {
    if (!pendingRole) return;

    const result = await updateMemberRole(memberId, pendingRole);

    if (result.error) {
      alert(result.error);
      setPendingRole(null);
      setIsDialogOpen(false);
      return;
    }

    setSelectedRole(pendingRole);
    setPendingRole(null);
    setIsDialogOpen(false);

    startTransition(() => {
      router.refresh();
    });
  }

  function handleCancel() {
    setPendingRole(null);
    setIsDialogOpen(false);
  }

  return (
    <>
      <Select value={selectedRole} onValueChange={handleValueChange}>
        <SelectTrigger disabled={isPending}>
          <SelectValue placeholder="Select Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="owner">Owner</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="member">Member</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to change{" "}
              <span className="font-medium text-foreground">{memberName}</span>&apos;s role from{" "}
              <span className="font-medium text-foreground">{roleLabels[selectedRole]}</span> to{" "}
              <span className="font-medium text-foreground">
                {pendingRole ? roleLabels[pendingRole] : ""}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
              {isPending ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
