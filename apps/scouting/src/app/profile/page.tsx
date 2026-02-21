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
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import PasskeyManager from "./passkey/PasskeyManager";

export default function ProfilePage() {
  const [open, setOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const router = useRouter();

  const { data: session, isPending } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();

  function handleLogOut() {
    authClient.signOut();
  }

  const currentMember = activeOrg?.members?.find(
    (m) => m.userId === session?.user?.id,
  );
  const isOwner = currentMember?.role === "owner";
  // const isOwner = currentMember?.role === "member";

  const transferableMembers =
    activeOrg?.members?.filter((m) => m.userId !== session?.user?.id) ?? [];

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
      setTransferError(error.message ?? "Transfer failed. Please try again.");
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
      setLeaveError(error.message ?? "Something went wrong. Please try again.");
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

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-sky-200">
        <div className="text-center text-yeti-500">Loading profile...</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
        <div className="max-w-xl w-full text-center">
          <h2 className="text-2xl font-semibold mb-2">You're not signed in</h2>
          <p className="text-sm text-neutral-400">
            Sign in to view your profile and progress.
          </p>
        </div>
      </div>
    );
  }

  const user = session.user;

  return (
    <main className="min-h-screen bg-background-black px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "avatar"}
                className="w-full h-full object-cover"
                width={300}
                height={300}
              />
            ) : (
              <div className="text-black font-mono">
                {(user.name || "?").charAt(0)}
                <h1>{user.name}</h1>
              </div>
            )}
          </div>
          <Button onClick={handleLogOut}>Log Out</Button>
        </header>

        <section className="bg-muted-black rounded-lg p-6 ring-ring mb-8 size-full mt-10">
          <h3 className="text-2xl font-semibold text-foreground-white mb-3">
            Account
          </h3>
          <PasskeyManager />
        </section>

        <Card className="rounded-lg p-6 ring-ring mb-8 size-full mt-10">
          <h3 className="text-2xl font-semibold text-foreground-white mb-3">
            Leave Organization
          </h3>

          {isOwner ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                You are the owner. Transfer ownership to another member before
                you can leave.
              </p>

              <Dialog
                open={transferOpen}
                onOpenChange={(next) => {
                  if (!isTransferring) {
                    setTransferError(null);
                    setSelectedMemberId("");
                    setTransferOpen(next);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-fit">
                    Transfer Ownership
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Transfer Ownership</DialogTitle>
                    <DialogDescription>
                      Before leaving the org you must choose soneone to transfer
                    </DialogDescription>
                  </DialogHeader>

                  {transferableMembers.length === 0 ? (
                    <p className="text-sm text-destructive">
                      No other members to transfer ownership into.
                    </p>
                  ) : (
                    <Select
                      value={selectedMemberId}
                      onValueChange={setSelectedMemberId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a member" />
                      </SelectTrigger>
                      <SelectContent>
                        {transferableMembers.map((member) => (
                          <SelectItem key={member.userId} value={member.userId}>
                            {member.user?.name ?? member.userId} — {member.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {transferError && (
                    <p className="text-sm text-destructive px-1">
                      {transferError}
                    </p>
                  )}

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setTransferOpen(false)}
                      disabled={isTransferring}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleTransferOwnership}
                      disabled={
                        isTransferring ||
                        !selectedMemberId ||
                        transferableMembers.length === 0
                      }
                    >
                      {isTransferring ? "Transferring..." : "Confirm Transfer"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <Dialog
              open={open}
              onOpenChange={(next) => {
                if (!isLeaving) {
                  setLeaveError(null);
                  setOpen(next);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-42">
                  Leave Organization
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you sure you want to leave?</DialogTitle>
                  <DialogDescription>
                    This cannot be undone. You will lose access to all
                    organization scouting data. If this is your only
                    organization, your account will be permanently deleted.
                  </DialogDescription>
                </DialogHeader>

                {leaveError && (
                  <p className="text-sm text-destructive px-1">{leaveError}</p>
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={isLeaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleLeaveOrganization}
                    disabled={isLeaving}
                  >
                    {isLeaving ? "Leaving..." : "Leave Organization"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </Card>
      </div>
    </main>
  );
}
