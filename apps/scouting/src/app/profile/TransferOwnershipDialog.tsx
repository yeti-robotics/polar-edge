"use client";

import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
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
import { useEffect, useState } from "react";
import { useTransferOwnership } from "@/features/org/hooks/useTransferOwnership";
import { authClient } from "@/lib/auth-client";

type Member = {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name?: string | null };
};

type Props = {
  organizationId: string;
};

export default function TransferOwnershipDialog({ organizationId }: Props) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Member | null>(null);
  const { transfer, isTransferring, error } =
    useTransferOwnership(organizationId);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    let mounted = true;
    async function loadMembers() {
      if (!organizationId) return;
      const res = await authClient.organization.listMembers();
      if (!mounted) return;
      const list = Array.isArray(res?.data)
        ? res.data
        : (res?.data?.members ?? []);
      setMembers(list as Member[]);
    }
    loadMembers();
    return () => {
      mounted = false;
    };
  }, [organizationId]);

  const selectableMembers = members.filter(
    (m) => m.userId !== session?.user?.id,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Transfer Ownership</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Ownership</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <Select
            onValueChange={(id) =>
              setSelected(selectableMembers.find((m) => m.id === id) || null)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a member" />
            </SelectTrigger>
            <SelectContent>
              {selectableMembers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.user?.name ?? m.userId} ({m.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && <div className="text-destructive mb-2">{error}</div>}

        <DialogFooter className="flex gap-2">
          <Button
            variant="destructive"
            onClick={() => selected && transfer(selected.id)}
            disabled={!selected || isTransferring}
          >
            {isTransferring ? "Transferring..." : "Confirm"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
