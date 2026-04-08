"use client";

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
import { toast } from "@repo/ui/components/sonner";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateShiftScheduleAction } from "@/features/shift-schedule/actions";
import {
  type ShiftScheduleEntry,
  type ShiftScheduleMatchBlock,
  STAND_STATIONS,
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
  matchBlocks: ShiftScheduleMatchBlock[];
};

function createEntry(): ShiftScheduleEntry {
  return {
    id: crypto.randomUUID(),
    memberId: null,
    name: "",
    email: null,
    assignmentType: "stand",
    standStation: "red1",
    matchStart: null,
    matchEnd: null,
  };
}

function formatStation(station: (typeof STAND_STATIONS)[number]) {
  const alliance = station.startsWith("red") ? "Red" : "Blue";
  return `${alliance} ${station.slice(-1)}`;
}

export function ScheduleForm({
  onSuccess,
  initialEntries,
  organizationMembers,
  matchBlocks,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [entries, setEntries] = useState<ShiftScheduleEntry[]>(
    initialEntries.length ? initialEntries : [createEntry()]
  );

  useEffect(() => {
    setEntries(initialEntries.length ? initialEntries : [createEntry()]);
  }, [initialEntries]);

  function updateEntry(entryId: string, updates: Partial<ShiftScheduleEntry>) {
    setEntries((current) =>
      current.map((entry) => (entry.id === entryId ? { ...entry, ...updates } : entry))
    );
  }

  function addEntry() {
    setEntries((current) => [...current, createEntry()]);
  }

  function removeEntry(entryId: string) {
    setEntries((current) =>
      current.length === 1 ? [createEntry()] : current.filter((entry) => entry.id !== entryId)
    );
  }

  function handleMemberChange(entryId: string, memberId: string) {
    const selectedMember = organizationMembers.find((member) => member.id === memberId);
    updateEntry(entryId, {
      memberId,
      name: selectedMember?.name ?? "",
      email: selectedMember?.email ?? null,
    });
  }

  function handleMatchBlockChange(entryId: string, value: string) {
    const [start, end] = value.split(":").map(Number);
    updateEntry(entryId, { matchStart: start, matchEnd: end });
  }

  async function handleSubmit() {
    if (
      entries.some(
        (entry) => !entry.memberId || !entry.standStation || !entry.matchStart || !entry.matchEnd
      )
    ) {
      toast.error("Each assignment needs a member, stand slot, and match block.");
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateShiftScheduleAction({ entries });
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Scouting schedule saved.");
      startTransition(() => router.refresh());
      onSuccess();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Assignments</p>
          <p className="text-sm text-muted-foreground">
            Every assignment is a stand form slot tied to a match block.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={addEntry} disabled={isSaving || isPending}>
          <PlusIcon className="size-4" />
          Add Assignment
        </Button>
      </div>

      <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="space-y-4 rounded-xl border border-red-200 bg-red-50/40 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-medium">{entry.name || `Assignment ${index + 1}`}</p>
                <Badge className="border-red-300 bg-red-100 text-red-800 hover:bg-red-100">
                  Stand Form
                </Badge>
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

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select
                  value={entry.memberId ?? ""}
                  onValueChange={(value) => handleMemberChange(entry.id, value)}
                  disabled={isSaving || isPending}
                >
                  <SelectTrigger className="w-full">
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
                <Label>Stand Slot</Label>
                <Select
                  value={entry.standStation ?? "red1"}
                  onValueChange={(value) =>
                    updateEntry(entry.id, {
                      standStation: value as ShiftScheduleEntry["standStation"],
                    })
                  }
                  disabled={isSaving || isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAND_STATIONS.map((station) => (
                      <SelectItem key={station} value={station}>
                        {formatStation(station)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Match Block</Label>
                <Select
                  value={
                    entry.matchStart && entry.matchEnd
                      ? `${entry.matchStart}:${entry.matchEnd}`
                      : undefined
                  }
                  onValueChange={(value) => handleMatchBlockChange(entry.id, value)}
                  disabled={isSaving || isPending || matchBlocks.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a 5-match block" />
                  </SelectTrigger>
                  <SelectContent>
                    {matchBlocks.map((block) => (
                      <SelectItem
                        key={`${block.start}-${block.end}`}
                        value={`${block.start}:${block.end}`}
                      >
                        {block.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSubmit} disabled={isSaving || isPending}>
          {isSaving || isPending ? "Saving..." : "Save Schedule"}
        </Button>
      </div>
    </div>
  );
}
