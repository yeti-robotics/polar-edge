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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { toast } from "@repo/ui/components/sonner";
import { useRouter } from "next/navigation";
import { type ReactNode, useActionState, useEffect, useRef, useState } from "react";
import { routes } from "@/lib/routes";
import { createScoutingScheduleAction, type CreateScoutingScheduleState } from "../actions";

interface EventOption {
  id: string;
  name: string;
  eventCode: string;
  startDate: Date | string;
  endDate: Date | string;
  isActive?: boolean;
}

interface CreateScoutingScheduleDialogProps {
  children: ReactNode;
  events: EventOption[];
  defaultEventId?: string | null;
}

const initialState: CreateScoutingScheduleState = {
  data: null,
  error: null,
};

function formatEventRange(startDate: Date | string, endDate: Date | string) {
  return `${new Date(startDate).toLocaleDateString(undefined, { timeZone: "UTC" })} - ${new Date(
    endDate
  ).toLocaleDateString(undefined, { timeZone: "UTC" })}`;
}

export function CreateScoutingScheduleDialog({
  children,
  events,
  defaultEventId = null,
}: CreateScoutingScheduleDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(defaultEventId ?? events[0]?.id ?? "");
  const [name, setName] = useState("");
  const [nameDirty, setNameDirty] = useState(false);
  const [state, formAction, isPending] = useActionState(createScoutingScheduleAction, initialState);
  const prevState = useRef(state);

  useEffect(() => {
    if (state === prevState.current) return;
    prevState.current = state;

    if (state.error) {
      toast.error(state.error);
      return;
    }

    if (state.data?.success) {
      toast.success("Scouting schedule created.");
      setOpen(false);
      setName("");
      setNameDirty(false);
      router.push(routes.scoutingSchedule.detail(state.data.scheduleId));
      router.refresh();
    }
  }, [router, state]);

  useEffect(() => {
    if (!open) {
      setSelectedEventId(defaultEventId ?? events[0]?.id ?? "");
      setNameDirty(false);
    }
  }, [defaultEventId, events, open]);

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;

  useEffect(() => {
    if (!selectedEvent) return;
    if (nameDirty && name.trim().length > 0) return;
    setName(selectedEvent.name);
  }, [name, nameDirty, selectedEvent]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Scouting Schedule</DialogTitle>
          <DialogDescription>
            Start a new event schedule and assign match coverage for your organization.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="eventId">Event</Label>
              <input type="hidden" name="eventId" value={selectedEventId} />
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger id="eventId">
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEvent && (
                <p className="text-sm text-muted-foreground">
                  {selectedEvent.eventCode.toUpperCase()} •{" "}
                  {formatEventRange(selectedEvent.startDate, selectedEvent.endDate)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Schedule Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Carolina Regional Schedule"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setNameDirty(true);
                }}
                maxLength={100}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !selectedEventId || name.trim().length === 0}>
              {isPending ? "Creating..." : "Create schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
