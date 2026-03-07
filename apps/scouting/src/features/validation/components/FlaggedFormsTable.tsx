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
import type { FlaggedFormRow } from "../queries";

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
          <AlertDialogTitle>Delete scouting form?</AlertDialogTitle>
          <AlertDialogDescription>
            This will soft-delete the form and remove it from all calculations. This action can
            only be undone via the database.
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

export function FlaggedFormsTable({ forms }: { forms: FlaggedFormRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Flagged Forms</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scout</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((form) => (
                <TableRow key={form.formId}>
                  <TableCell>{form.scoutName ?? <span className="text-muted-foreground">Unknown</span>}</TableCell>
                  <TableCell className="font-mono">{form.teamNumber}</TableCell>
                  <TableCell className="font-mono">QM {form.matchNumber}</TableCell>
                  <TableCell>
                    {form.reason === "empty" ? (
                      <Badge variant="warning">Empty form</Badge>
                    ) : (
                      <Badge variant="destructive">
                        Robot broken ({form.oofTimeSeconds}s)
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {form.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DeleteFormButton formId={form.formId} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
