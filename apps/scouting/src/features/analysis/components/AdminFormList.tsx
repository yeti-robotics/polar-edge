"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { deletePitFormAction, deleteStandFormAction } from "@/features/validation/actions";

export type AdminFormRow = {
  id: string;
  type: "stand" | "pit";
  teamNumber: number;
  matchType: string | null;
  matchNumber: number | null;
  alliance: string | null;
  position: number | null;
  scoutName: string | null;
  createdAt: Date | string;
};

function formatSlot(alliance: string | null, position: number | null) {
  if (!alliance || position == null) return null;
  const ally = alliance.toLowerCase();
  return `${ally}${position}`; // e.g. red1
}

function DeleteFormButton({ id, type }: { id: string; type: "stand" | "pit" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    const result =
      type === "stand" ? await deleteStandFormAction(id) : await deletePitFormAction(id);
    setPending(false);
    if (!result.error) router.refresh();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" disabled={pending} aria-label="Delete form">
          <Trash2Icon className="size-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete scouting form?</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <AlertDialogCancel asChild>
            <Button variant="ghost">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleDelete} disabled={pending} variant="destructive">
              Delete
            </Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AdminFormList({ forms }: { forms: AdminFormRow[] }) {
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [userFilter, setUserFilter] = useState<string>("");
  const [slotFilter, setSlotFilter] = useState<string>("");

  const filtered = useMemo(() => {
    return forms.filter((f) => {
      if (teamFilter) {
        if (String(f.teamNumber) !== teamFilter) return false;
      }
      if (userFilter) {
        if (!f.scoutName || !f.scoutName.toLowerCase().includes(userFilter.toLowerCase()))
          return false;
      }
      if (slotFilter) {
        const slot = formatSlot(f.alliance, f.position);
        if (!slot || slot.toLowerCase() !== slotFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [forms, teamFilter, userFilter, slotFilter]);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input
          className="input"
          placeholder="Filter team (e.g. 1234)"
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
        />
        <input
          className="input"
          placeholder="Filter scout name"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
        />
        <input
          className="input"
          placeholder="Filter slot (red1, blue2)"
          value={slotFilter}
          onChange={(e) => setSlotFilter(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Slot</TableHead>
              <TableHead>Scout</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-mono">{f.type}</TableCell>
                <TableCell className="font-mono">{f.teamNumber}</TableCell>
                <TableCell className="font-mono">
                  {f.matchType && f.matchNumber
                    ? `${f.matchType.toUpperCase()} ${f.matchNumber}`
                    : "—"}
                </TableCell>
                <TableCell className="font-mono">
                  {formatSlot(f.alliance, f.position) ?? "—"}
                </TableCell>
                <TableCell>{f.scoutName ?? "Unknown"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(f.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <DeleteFormButton id={f.id} type={f.type} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default AdminFormList;
