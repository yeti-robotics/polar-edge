"use client";

import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { toast } from "@repo/ui/components/sonner";
import { type ReactNode, useActionState, useEffect, useRef, useState } from "react";
import { type CreatePicklistState, createPicklistAction } from "../actions";

interface CreatePicklistDialogProps {
  children: ReactNode;
}

const initialState: CreatePicklistState = { data: null, error: null };

export function CreatePicklistDialog({ children }: CreatePicklistDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [state, formAction, isPending] = useActionState(createPicklistAction, initialState);
  const prevState = useRef(state);

  useEffect(() => {
    if (state === prevState.current) return;
    prevState.current = state;

    if (state.error) {
      toast.error(state.error);
    } else if (state.data?.success) {
      toast.success("Picklist created");
      setName("");
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Picklist</DialogTitle>
          <DialogDescription>
            Create a new picklist for ranking teams during alliance selection.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Picklist Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="My Picklist"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
