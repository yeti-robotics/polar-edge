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
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { deletePicklist } from "../actions";

interface DeletePicklistButtonProps {
  picklistId: string;
  children: ReactNode;
}

export function DeletePicklistButton({ picklistId, children }: DeletePicklistButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deletePicklist({ picklistId });

    if ("error" in result) {
      console.error("Failed to delete picklist:", result.error);
      setIsDeleting(false);
      return;
    }

    router.push("/picklist");
    router.refresh();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Picklist</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this picklist? This action cannot be undone. All teams
            in this picklist will be removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
