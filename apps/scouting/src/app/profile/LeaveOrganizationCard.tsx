"use client";

import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function LeaveOrganizationCard({ session, activeOrg }: any) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const currentMember = activeOrg?.members?.find(
    (m: any) => m.userId === session?.user?.id,
  );

  const isOwner = currentMember?.role === "member";
  //  test with changing the role. == too different things.

  const transferableMembers =
    activeOrg?.members?.filter((m: any) => m.userId !== session?.user?.id) ??
    [];

  async function handleTransferOwnership() {
    if (!activeOrg?.id || !selectedMemberId) return;

    setIsTransferring(true);
    setTransferError(null);

    const { error } = await authClient.organization.updateMemberRole({
      organizationId: activeOrg.id,
      userId: selectedMemberId,
      role: "owner",
    });

    if (error) {
      setTransferError(error.message ?? "Transfer failed.");
      setIsTransferring(false);
      return;
    }

    setTransferOpen(false);
    setIsTransferring(false);
    setSelectedMemberId("");
    router.refresh();
  }

  async function handleLeaveOrganization() {
    if (!activeOrg?.id) return;

    setIsLeaving(true);
    setLeaveError(null);

    const { error } = await authClient.organization.leave({
      organizationId: activeOrg.id,
    });

    if (error) {
      setLeaveError(error.message ?? "Something went wrong.");
      setIsLeaving(false);
      return;
    }

    const { data: orgs } = await authClient.organization.list();

    if (!orgs || orgs.length === 0) {
      await authClient.deleteUser();
      await authClient.signOut();
      router.push("/");
      return;
    }

    setOpen(false);
    setIsLeaving(false);
    router.push("/organization/select");
  }

  return (
    <Card className="rounded-lg p-6 ring-ring mb-8 size-full mt-10">
      <h3 className="text-2xl font-semibold text-foreground-white mb-3">
        Leave Organization
      </h3>

      {isOwner ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Transfer ownership before leaving.
          </p>

          <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-38">
                Transfer Ownership
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transfer Ownership</DialogTitle>
                <DialogDescription>
                  Choose a new owner for the organization before leaving.
                </DialogDescription>
              </DialogHeader>

              <Select
                value={selectedMemberId}
                onValueChange={setSelectedMemberId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {transferableMembers.map((member: any) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.user?.name ?? member.userId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {transferError && (
                <p className="text-sm text-destructive">{transferError}</p>
              )}

              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={handleTransferOwnership}
                  disabled={!selectedMemberId || isTransferring}
                >
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-36">
              Leave Organization
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Leave Organization?</DialogTitle>
              <DialogDescription>
                This cannot be undone. You will lose access to the
                organization.{" "}
              </DialogDescription>
            </DialogHeader>

            {leaveError && (
              <p className="text-sm text-destructive">{leaveError}</p>
            )}

            <DialogFooter>
              <Button
                variant="destructive"
                onClick={handleLeaveOrganization}
                disabled={isLeaving}
              >
                {isLeaving ? "Leaving..." : "Leave"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
