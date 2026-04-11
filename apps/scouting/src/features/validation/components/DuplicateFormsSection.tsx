"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { resolveDuplicatesAction } from "../actions";
import type { DuplicateGroup } from "../queries";

function DuplicateGroupCard({ group }: { group: DuplicateGroup }) {
  const router = useRouter();
  const [keepFormId, setKeepFormId] = useState<string>(group.forms[0]?.formId ?? "");
  const [pending, setPending] = useState(false);

  async function handleResolve() {
    const deleteFormIds = group.forms.map((f) => f.formId).filter((id) => id !== keepFormId);
    setPending(true);
    const result = await resolveDuplicatesAction(keepFormId, deleteFormIds);
    setPending(false);
    if (!result.error) {
      router.refresh();
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">QM {group.matchNumber}</span>
          <span className="text-muted-foreground">—</span>
          <span className="font-mono">Team {group.teamNumber}</span>
          <span className="text-muted-foreground">—</span>
          <span>
            {group.scoutName ?? <span className="text-muted-foreground">Unknown scout</span>}
          </span>
        </div>
        <Badge variant="destructive">{group.forms.length} duplicates</Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">Keep</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Cycles</TableHead>
            <TableHead>Climbs</TableHead>
            <TableHead>OOF (s)</TableHead>
            <TableHead>Comments</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {group.forms.map((form) => (
            <TableRow
              key={form.formId}
              data-state={keepFormId === form.formId ? "selected" : undefined}
              className="cursor-pointer"
              onClick={() => setKeepFormId(form.formId)}
            >
              <TableCell>
                <input
                  type="radio"
                  name={`keep-${group.teamMatchId}-${group.scoutMemberId}`}
                  checked={keepFormId === form.formId}
                  onChange={() => setKeepFormId(form.formId)}
                  className="cursor-pointer"
                />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {form.createdAt.toLocaleString()}
              </TableCell>
              <TableCell className="font-mono">{form.cycleCount}</TableCell>
              <TableCell className="font-mono">{form.climbCount}</TableCell>
              <TableCell className="font-mono">{form.oofTimeSeconds}</TableCell>
              <TableCell className="font-mono">{form.commentsLength} chars</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={pending}>
              Resolve — delete {group.forms.length - 1} duplicate
              {group.forms.length - 1 !== 1 ? "s" : ""}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete duplicate forms?</AlertDialogTitle>
              <AlertDialogDescription>
                This will soft-delete {group.forms.length - 1} duplicate form
                {group.forms.length - 1 !== 1 ? "s" : ""} and keep the selected one. Deleted forms
                are removed from all calculations. This can only be undone via the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResolve} disabled={pending}>
                Delete duplicates
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export function DuplicateFormsSection({ groups }: { groups: DuplicateGroup[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle>Duplicate Forms</CardTitle>
          <Badge variant="destructive">{groups.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {groups.map((group) => (
          <DuplicateGroupCard key={`${group.teamMatchId}-${group.scoutMemberId}`} group={group} />
        ))}
      </CardContent>
    </Card>
  );
}
