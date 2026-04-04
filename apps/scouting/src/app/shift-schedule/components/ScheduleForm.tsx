"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Label } from "@repo/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Separator } from "@repo/ui/components/separator";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/sonner";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateShiftScheduleAction } from "@/features/shift-schedule/actions";
import {
  SCOUTING_ROLE_OPTIONS,
  SHIFT_OPTIONS,
  type ShiftScheduleEntry,
} from "@/features/shift-schedule/types";

type OrganizationMemberOption = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
};

type Props = {
  onSuccess: () => void;
  initialEntries: ShiftScheduleEntry[];
  organizationMembers: OrganizationMemberOption[];
};

function createEntry(): ShiftScheduleEntry {
  return {
    id: crypto.randomUUID(),
    memberId: null,
    name: "",
    email: null,
    role: "",
    shift: "",
    notes: "",
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ScheduleForm({ onSuccess, initialEntries, organizationMembers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [entries, setEntries] = useState<ShiftScheduleEntry[]>(
    initialEntries.length > 0
      ? initialEntries.map((entry) => ({
          ...entry,
          memberId: entry.memberId ?? null,
          email: entry.email ?? null,
          notes: entry.notes ?? "",
        }))
      : [createEntry()]
  );

  useEffect(() => {
    setEntries(
      initialEntries.length > 0
        ? initialEntries.map((entry) => ({
            ...entry,
            memberId: entry.memberId ?? null,
            email: entry.email ?? null,
            notes: entry.notes ?? "",
          }))
        : [createEntry()]
    );
  }, [initialEntries]);

  function updateEntry(entryId: string, updates: Partial<ShiftScheduleEntry>) {
    setEntries((current) =>
      current.map((entry) => (entry.id === entryId ? { ...entry, ...updates } : entry))
    );
  }

  function handleAssigneeChange(entryId: string, memberId: string) {
    const selectedMember = organizationMembers.find((member) => member.id === memberId);
    if (!selectedMember) {
      updateEntry(entryId, { memberId: null, name: "", email: null });
      return;
    }

    updateEntry(entryId, {
      memberId: selectedMember.id,
      name: selectedMember.name,
      email: selectedMember.email,
    });
  }

  function addEntry() {
    setEntries((current) => [...current, createEntry()]);
  }

  function removeEntry(entryId: string) {
    setEntries((current) => {
      if (current.length === 1) {
        return [createEntry()];
      }

      return current.filter((entry) => entry.id !== entryId);
    });
  }

  async function handleSubmit() {
    const payloadEntries = entries.map((entry) => ({
      id: entry.id,
      memberId: entry.memberId ?? null,
      name: entry.name.trim(),
      email: entry.email?.trim() || null,
      role: entry.role.trim(),
      shift: entry.shift.trim(),
      notes: entry.notes?.trim() || null,
    }));

    const hasEmptyAssignedSlot = payloadEntries.some(
      (entry) => !entry.memberId || !entry.role || !entry.shift
    );

    if (hasEmptyAssignedSlot) {
      toast.error("Each assignment needs a member, role, and shift.");
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateShiftScheduleAction({
        entries: payloadEntries,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Scouting assignments saved.");
      startTransition(() => {
        router.refresh();
      });
      onSuccess();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Assignments</p>
          <p className="text-sm text-muted-foreground">
            Choose organization members, then set their shift and scouting responsibility.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={addEntry} disabled={isSaving || isPending}>
          <PlusIcon className="size-4" />
          Add Assignment
        </Button>
      </div>

      <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
        {entries.map((entry, index) => {
          const selectedMember = organizationMembers.find((member) => member.id === entry.memberId);

          return (
            <div key={entry.id} className="rounded-xl border bg-muted/20 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarImage
                      src={selectedMember?.image ?? undefined}
                      alt={entry.name || "Unassigned member"}
                    />
                    <AvatarFallback>{getInitials(entry.name || "U A")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {entry.name || `Assignment ${index + 1}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {entry.email ?? "Select a member from your organization"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEntry(entry.id)}
                  disabled={isSaving || isPending}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Select
                    value={entry.memberId ?? ""}
                    onValueChange={(value) => handleAssigneeChange(entry.id, value)}
                    disabled={isSaving || isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Shift</Label>
                  <Select
                    value={entry.shift}
                    onValueChange={(value) => updateEntry(entry.id, { shift: value })}
                    disabled={isSaving || isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a shift block" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIFT_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Scouting Role</Label>
                  <Select
                    value={entry.role}
                    onValueChange={(value) => updateEntry(entry.id, { role: value })}
                    disabled={isSaving || isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a scouting role" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCOUTING_ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`notes-${entry.id}`}>Notes</Label>
                  <Textarea
                    id={`notes-${entry.id}`}
                    placeholder="Optional notes for coverage, breaks, or backup assignments"
                    value={entry.notes ?? ""}
                    disabled={isSaving || isPending}
                    onChange={(event) => updateEntry(entry.id, { notes: event.target.value })}
                    className="min-h-24"
                  />
                </div>
              </div>

              {selectedMember ? (
                <>
                  <Separator className="my-4" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Organization role</span>
                    <Badge variant="secondary" className="capitalize">
                      {selectedMember.role}
                    </Badge>
                  </div>
                </>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSubmit} disabled={isSaving || isPending}>
          {isSaving || isPending ? "Saving..." : "Save Assignments"}
        </Button>
      </div>
    </div>
  );
}
