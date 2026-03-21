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
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteStandFormAction } from "../actions";
import type { DuplicateFormGroup } from "../queries";

function DeleteFormButton({ formId }: { formId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    const result = await deleteStandFormAction(formId);
    setPending(false);
    if (!result.error) {
      router.refresh();
    }
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
          <AlertDialogTitle>Delete duplicate form?</AlertDialogTitle>
          <AlertDialogDescription>
            This will soft-delete the form and remove it from all calculations. This action can only
            be undone via the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={pending}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DuplicateFormsTable({ groups }: { groups: DuplicateFormGroup[] }) {
  const totalDuplicates = groups.reduce((sum, g) => sum + g.forms.length - 1, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle>Duplicate Forms</CardTitle>
          <Badge variant="destructive">{totalDuplicates} extra</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[480px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Scout</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Cycles</TableHead>
                <TableHead>Climbs</TableHead>
                <TableHead>OOF (s)</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) =>
                group.forms.map((form, i) => (
                  <TableRow key={form.formId} className={i === 0 ? "border-t-2" : "bg-muted/40"}>
                    <TableCell>
                      {i === 0 ? (
                        (group.scoutName ?? <span className="text-muted-foreground">Unknown</span>)
                      ) : (
                        <span className="text-muted-foreground text-xs">duplicate</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{group.teamNumber}</TableCell>
                    <TableCell className="font-mono">QM {group.matchNumber}</TableCell>
                    <TableCell className="font-mono">{form.cycleCount}</TableCell>
                    <TableCell className="font-mono">{form.climbCount}</TableCell>
                    <TableCell className="font-mono">{form.oofTimeSeconds}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {form.createdAt.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DeleteFormButton formId={form.formId} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
