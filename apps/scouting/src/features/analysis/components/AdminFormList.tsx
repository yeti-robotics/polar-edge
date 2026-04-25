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
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { EyeIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  deletePitFormAction,
  deleteStandFormAction,
} from "@/features/validation/actions";

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
      type === "stand"
        ? await deleteStandFormAction(id)
        : await deletePitFormAction(id);
    setPending(false);
    if (!result.error) router.refresh();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={pending}
          aria-label="Delete form"
        >
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
            <Button
              onClick={handleDelete}
              disabled={pending}
              variant="destructive"
            >
              Delete
            </Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2 items-start">
      <div className="w-28 text-sm text-muted-foreground">{label}</div>
      <div className="flex-1 text-sm">{children}</div>
    </div>
  );
}

function StandPitDetail({
  payload,
  type,
}: {
  payload: Record<string, unknown>;
  type: "stand" | "pit";
}) {
  // Pit layout
  if (type === "pit") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pit form</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <SummaryRow label="Team">
              {String(payload.teamNumber ?? "—")}
            </SummaryRow>
            <SummaryRow label="Scout">
              {String(payload.scoutName ?? "Unknown")}
            </SummaryRow>
            <SummaryRow label="Submitted">
              {new Date(String(payload.createdAt ?? "")).toLocaleString()}
            </SummaryRow>
            <SummaryRow label="Drivetrain">
              {String(payload.drivetrainType ?? "—")}
            </SummaryRow>
            <SummaryRow label="Capacity">
              {String(payload.capacity ?? "—")}
            </SummaryRow>
            <SummaryRow label="Weight">
              {String(payload.weight ?? "—")}
            </SummaryRow>
            <SummaryRow label="Climb type">
              {String(payload.climbType ?? "—")}
            </SummaryRow>
            <SummaryRow label="Shooter type">
              {String(payload.shooterType ?? "—")}
            </SummaryRow>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Stand layout
  const cycles: Array<Record<string, unknown>> = Array.isArray(payload.cycles)
    ? (payload.cycles as Array<Record<string, unknown>>)
    : [];
  const climbs: Array<Record<string, unknown>> = Array.isArray(payload.climbs)
    ? (payload.climbs as Array<Record<string, unknown>>)
    : [];
  const cyclesError =
    typeof payload.cyclesError === "string"
      ? (payload.cyclesError as string)
      : null;
  const climbsError =
    typeof payload.climbsError === "string"
      ? (payload.climbsError as string)
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stand form</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            <SummaryRow label="Team">
              {String(payload.teamNumber ?? "—")}
            </SummaryRow>
            <SummaryRow label="Match">
              {payload.matchType && payload.matchNumber
                ? `${String(payload.matchType).toUpperCase()} ${String(payload.matchNumber)}`
                : "—"}
            </SummaryRow>
            <SummaryRow label="Slot">
              {payload.alliance && payload.position
                ? `${String(payload.alliance)}${String(payload.position)}`
                : "—"}
            </SummaryRow>
            <SummaryRow label="Scout">
              {String(payload.scoutName ?? "Unknown")}
            </SummaryRow>
            <SummaryRow label="Submitted">
              {new Date(String(payload.createdAt ?? "")).toLocaleString()}
            </SummaryRow>
            <SummaryRow label="Oof time seconds">
              {String(payload.oofTimeSeconds ?? "—")}
            </SummaryRow>
            <div className="col-span-2">
              <SummaryRow label="Comments">
                {String(payload.comments ?? "—")}
              </SummaryRow>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Cycles</h4>
              <Badge>{cycles.length} recorded</Badge>
            </div>

            {cyclesError ? (
              <div className="text-sm text-destructive">{cyclesError}</div>
            ) : cycles.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No cycles recorded
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="pr-4">Phase</th>
                      <th className="pr-4">Bucket</th>
                      <th className="pr-4">Dumped (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cycles.map((c, i) => {
                      const row = c as Record<string, unknown>;
                      return (
                        <tr key={i} className="border-t">
                          <td className="py-2">
                            {String(row.cyclePhase ?? row.phase ?? "—")}
                          </td>
                          <td className="py-2">{String(row.bucket ?? "—")}</td>
                          <td className="py-2">
                            {row.dumpDuration != null
                              ? Number(
                                  row.dumpDuration as unknown as number,
                                ).toFixed(6)
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Climbs</h4>
              <Badge>{climbs.length} recorded</Badge>
            </div>

            {climbsError ? (
              <div className="text-sm text-destructive">{climbsError}</div>
            ) : climbs.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No climbs recorded
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="pr-4">Phase</th>
                      <th className="pr-4">Level</th>
                      <th className="pr-4">Success</th>
                      <th className="pr-4">Duration (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {climbs.map((c, i) => {
                      const row = c as Record<string, unknown>;
                      return (
                        <tr key={i} className="border-t">
                          <td className="py-2">
                            {String(row.climbPhase ?? row.phase ?? "—")}
                          </td>
                          <td className="py-2">
                            {String(row.climbLevel ?? row.level ?? "—")}
                          </td>
                          <td className="py-2">
                            {(row.climbSuccess as unknown) ? "Yes" : "No"}
                          </td>
                          <td className="py-2">
                            {row.climbDuration != null
                              ? Number(
                                  row.climbDuration as unknown as number,
                                ).toFixed(6)
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ViewFormButton({ id, type }: { id: string; type: "stand" | "pit" }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen() {
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/analysis/form?id=${encodeURIComponent(id)}&type=${encodeURIComponent(type)}`,
      );
      const json = await res.json();
      if (!res.ok) {
        const j = json as Record<string, unknown> | null;
        setError(j?.error ? String(j.error) : "Failed to load");
        setPayload(null);
      } else {
        setPayload(json.data ?? json);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="View form"
          onClick={handleOpen}
        >
          <EyeIcon className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Form details</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : error ? (
            <div className="text-destructive text-sm">{error}</div>
          ) : payload ? (
            <StandPitDetail payload={payload} type={type} />
          ) : (
            <div className="text-sm text-muted-foreground">No data</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
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
        if (
          !f.scoutName ||
          !f.scoutName.toLowerCase().includes(userFilter.toLowerCase())
        )
          return false;
      }
      if (slotFilter) {
        const slot = formatSlot(f.alliance, f.position);
        if (!slot || slot.toLowerCase() !== slotFilter.toLowerCase())
          return false;
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
                  <div className="flex gap-2">
                    <ViewFormButton id={f.id} type={f.type} />
                    <DeleteFormButton id={f.id} type={f.type} />
                  </div>
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
