"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/command";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { TypographyH1 } from "@repo/ui/components/typography";
import { cn } from "@repo/ui/lib/utils";
import { ArrowLeftIcon, PencilLineIcon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { routes } from "@/lib/routes";
import { updateScoutingScheduleAssignment, updateScoutingScheduleDetails } from "../actions";
import type { ScoutingScheduleBoardMatch } from "../logic";
import {
  buildDefaultShiftSections,
  createScheduleNodeId,
  formatScheduleDateRange,
  groupMatchesByShifts,
} from "../logic";
import type { ScoutingScheduleDetailData, ScoutingScheduleMember } from "../queries";
import type { ScoutingScheduleInfoSection, ScoutingScheduleShiftSection } from "../types";
import { RosterSidebar, ShiftGroup } from "./ScoutingScheduleBoardSections";

interface ScoutingScheduleBoardProps {
  data: ScoutingScheduleDetailData;
  canEdit: boolean;
}

type PickerTarget = {
  kind: "seat" | "coordinator";
  teamMatchId?: number;
  slotIndex?: 1 | 2;
  shiftId?: string;
};

function getMemberInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function roleLabel(role: string) {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "scout_lead":
      return "Scouting Lead";
    default:
      return "Member";
  }
}

function snapshotScheduleDetails(schedule: {
  name: string;
  isOpen: boolean;
  infoSections: ScoutingScheduleInfoSection[];
  shiftSections: ScoutingScheduleShiftSection[];
}) {
  return JSON.stringify({
    name: schedule.name,
    isOpen: schedule.isOpen,
    infoSections: schedule.infoSections,
    shiftSections: schedule.shiftSections,
  });
}

function ScheduleMemberAvatar({
  member,
  className,
}: {
  member: Pick<ScoutingScheduleMember, "name" | "image">;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-7", className)}>
      <AvatarImage src={member.image ?? undefined} alt={member.name} />
      <AvatarFallback className="text-[10px]">{getMemberInitials(member.name)}</AvatarFallback>
    </Avatar>
  );
}

function shouldAutoSplitShiftSections(
  matches: ScoutingScheduleBoardMatch[],
  shifts: ScoutingScheduleShiftSection[]
) {
  if (matches.length === 0 || shifts.length === 0) return false;
  if (shifts.length > 1) return false;

  const onlyShift = shifts[0];
  const firstMatch = matches[0]?.matchNumber;
  const lastMatch = matches[matches.length - 1]?.matchNumber;

  if (!onlyShift || firstMatch == null || lastMatch == null) return false;

  return (
    onlyShift.startMatch === firstMatch &&
    onlyShift.endMatch === lastMatch &&
    onlyShift.coordinatorMemberId == null
  );
}

function ScheduleInfoPreview({ sections }: { sections: ScoutingScheduleInfoSection[] }) {
  if (sections.length === 0) {
    return <p className="text-sm text-muted-foreground">No competition info has been added yet.</p>;
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.id} className="overflow-hidden rounded-xl border">
          {section.items.length === 0 ? (
            <div className="px-4 py-3">
              <p className="font-medium">{section.dateLabel}</p>
              <p className="text-sm text-muted-foreground">No items added for this day yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48 bg-secondary/50 font-semibold">
                    {section.dateLabel}
                  </TableHead>
                  {section.items.map((item) => (
                    <TableHead key={item.id} className="bg-secondary/50 text-center font-semibold">
                      {item.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Time</TableCell>
                  {section.items.map((item) => (
                    <TableCell key={item.id} className="text-center">
                      {item.time}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          )}
        </div>
      ))}
    </div>
  );
}

export function ScoutingScheduleBoard({ data, canEdit }: ScoutingScheduleBoardProps) {
  const [schedule, setSchedule] = useState(data.schedule);
  const [matches, setMatches] = useState(data.matches);
  const [detailsMode, setDetailsMode] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [activeAssignmentKey, setActiveAssignmentKey] = useState<string | null>(null);
  const [savedSchedule, setSavedSchedule] = useState(data.schedule);
  const [savedDetailsSnapshot, setSavedDetailsSnapshot] = useState(() =>
    snapshotScheduleDetails(data.schedule)
  );
  const [isSavingDetails, startSavingDetails] = useTransition();
  const [isSavingAssignment, startSavingAssignment] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

  const memberMap = useMemo(
    () => new Map(data.members.map((member) => [member.id, member])),
    [data.members]
  );

  const filteredMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    if (!query) {
      return data.members;
    }

    return data.members.filter((member) => {
      return (
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        roleLabel(member.role).toLowerCase().includes(query)
      );
    });
  }, [data.members, memberSearch]);

  const groupedMatches = useMemo(
    () => groupMatchesByShifts(matches, schedule.shiftSections),
    [matches, schedule.shiftSections]
  );

  const detailsAreDirty = snapshotScheduleDetails(schedule) !== savedDetailsSnapshot;
  const pendingAssignmentKey = isSavingAssignment ? activeAssignmentKey : null;
  const pickerTitle =
    pickerTarget?.kind === "coordinator"
      ? "Assign event coordinator"
      : pickerTarget?.slotIndex
        ? `Assign scout ${pickerTarget.slotIndex}`
        : "Assign scout";

  useEffect(() => {
    if (!shouldAutoSplitShiftSections(matches, schedule.shiftSections)) return;

    setSchedule((current) => {
      if (!shouldAutoSplitShiftSections(matches, current.shiftSections)) {
        return current;
      }

      return {
        ...current,
        shiftSections: buildDefaultShiftSections(matches.map((entry) => entry.matchNumber)),
      };
    });
  }, [matches, schedule.shiftSections]);

  function updateSeatState(teamMatchId: number, slotIndex: 1 | 2, memberId: string | null) {
    setMatches((current) =>
      current.map((matchEntry) => ({
        ...matchEntry,
        teams: matchEntry.teams.map((teamSlot) => {
          if (teamSlot.teamMatchId !== teamMatchId) {
            return teamSlot;
          }

          return {
            ...teamSlot,
            assignments: teamSlot.assignments.map((assignment) => {
              if (memberId && assignment.memberId === memberId) {
                return { ...assignment, memberId: null };
              }

              if (assignment.slotIndex === slotIndex) {
                return { ...assignment, memberId };
              }

              return assignment;
            }),
          };
        }),
      }))
    );
  }

  function assignMember(teamMatchId: number, slotIndex: 1 | 2, memberId: string | null) {
    const seatKey = `${teamMatchId}:${slotIndex}`;
    setActiveAssignmentKey(seatKey);

    startSavingAssignment(async () => {
      const result = await updateScoutingScheduleAssignment({
        scheduleId: schedule.id,
        teamMatchId,
        slotIndex,
        memberId,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      updateSeatState(teamMatchId, slotIndex, memberId);
      setPickerTarget(null);
    });
  }

  function assignCoordinator(shiftId: string, memberId: string | null) {
    setSchedule((current) => ({
      ...current,
      shiftSections: current.shiftSections.map((shift) =>
        shift.id === shiftId ? { ...shift, coordinatorMemberId: memberId } : shift
      ),
    }));
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!canEdit || !event.over) return;

    const memberId = event.active.data.current?.memberId;
    const drop = event.over.data.current as PickerTarget | undefined;

    if (typeof memberId !== "string" || !drop) return;

    if (drop.kind === "seat" && drop.teamMatchId != null && drop.slotIndex != null) {
      assignMember(drop.teamMatchId, drop.slotIndex, memberId);
      return;
    }

    if (drop.kind === "coordinator" && drop.shiftId) {
      assignCoordinator(drop.shiftId, memberId);
    }
  }

  function updateInfoSection(
    sectionId: string,
    updater: (section: ScoutingScheduleInfoSection) => ScoutingScheduleInfoSection
  ) {
    setSchedule((current) => ({
      ...current,
      infoSections: current.infoSections.map((section) =>
        section.id === sectionId ? updater(section) : section
      ),
    }));
  }

  function updateShiftSection(
    shiftId: string,
    updater: (shift: ScoutingScheduleShiftSection) => ScoutingScheduleShiftSection
  ) {
    setSchedule((current) => ({
      ...current,
      shiftSections: current.shiftSections.map((shift) =>
        shift.id === shiftId ? updater(shift) : shift
      ),
    }));
  }

  function addInfoSection() {
    setSchedule((current) => ({
      ...current,
      infoSections: [
        ...current.infoSections,
        {
          id: createScheduleNodeId("info"),
          dateLabel: "New day",
          items: [],
        },
      ],
    }));
  }

  function addInfoItem(sectionId: string) {
    updateInfoSection(sectionId, (section) => ({
      ...section,
      items: [
        ...section.items,
        {
          id: createScheduleNodeId("item"),
          label: "New item",
          time: "TBD",
        },
      ],
    }));
  }

  function addShiftSection() {
    const nextStartMatch =
      schedule.shiftSections[schedule.shiftSections.length - 1]?.endMatch ??
      matches[matches.length - 1]?.matchNumber ??
      1;

    setSchedule((current) => ({
      ...current,
      shiftSections: [
        ...current.shiftSections,
        {
          id: createScheduleNodeId("shift"),
          label: `Shift ${current.shiftSections.length + 1}`,
          startMatch: nextStartMatch,
          endMatch: nextStartMatch,
          coordinatorMemberId: null,
        },
      ],
    }));
  }

  function handleCancelDetails() {
    setSchedule(savedSchedule);
    setSavedDetailsSnapshot(snapshotScheduleDetails(savedSchedule));
    setDetailsMode(false);
  }

  function handleSaveDetails() {
    startSavingDetails(async () => {
      const result = await updateScoutingScheduleDetails({
        scheduleId: schedule.id,
        name: schedule.name,
        isOpen: schedule.isOpen,
        infoSections: schedule.infoSections,
        shiftSections: schedule.shiftSections,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      const nextSnapshot = snapshotScheduleDetails(schedule);
      setSavedSchedule(schedule);
      setSavedDetailsSnapshot(nextSnapshot);
      setDetailsMode(false);
      toast.success("Scouting schedule saved.");
    });
  }

  const visibleInfoSections = schedule.infoSections.filter((section) => section.items.length > 0);

  function handleSeatAssignment(target: PickerTarget, memberId: string | null) {
    if (target.kind !== "seat" || target.teamMatchId == null || target.slotIndex == null) {
      return;
    }

    assignMember(target.teamMatchId, target.slotIndex, memberId);
  }

  return (
    <main className="container mx-auto max-w-[1600px] px-4 py-8">
      <div className="mb-8 space-y-4">
        <Link
          href={routes.scoutingSchedule.root}
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="mr-2 size-4" />
          Back to scouting schedules
        </Link>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{data.schedule.event.eventCode.toUpperCase()}</Badge>
            </div>
            <div>
              <TypographyH1>{schedule.name}</TypographyH1>
              <p className="mt-2 text-muted-foreground">
                {data.schedule.event.name} •{" "}
                {formatScheduleDateRange(
                  data.schedule.event.startDate,
                  data.schedule.event.endDate
                )}{" "}
                • {matches.length} qualification {matches.length === 1 ? "match" : "matches"}
              </p>
            </div>
          </div>

          {canEdit && (
            <div className="flex flex-wrap gap-2">
              {!detailsMode ? (
                <Button variant="outline" onClick={() => setDetailsMode(true)}>
                  <PencilLineIcon className="size-4" />
                  Edit details
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelDetails}
                    disabled={isSavingDetails}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveDetails}
                    disabled={isSavingDetails || !detailsAreDirty}
                  >
                    <SaveIcon className="size-4" />
                    {isSavingDetails ? "Saving..." : "Save changes"}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {detailsMode && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Schedule setup</CardTitle>
            <CardDescription>
              Edit the event timeline and match-set structure here while keeping the assignment
              board wide and sheet-like.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general">
              <TabsList className="grid w-full max-w-[540px] grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="match-sets">Match sets</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 pt-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="schedule-name">Schedule name</Label>
                    <Input
                      id="schedule-name"
                      value={schedule.name}
                      onChange={(event) =>
                        setSchedule((current) => ({ ...current, name: event.target.value }))
                      }
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schedule-status">Status</Label>
                    <Select
                      value={schedule.isOpen ? "open" : "closed"}
                      onValueChange={(value) =>
                        setSchedule((current) => ({
                          ...current,
                          isOpen: value === "open",
                        }))
                      }
                    >
                      <SelectTrigger id="schedule-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Event
                    </p>
                    <p className="mt-2 font-medium">{data.schedule.event.name}</p>
                  </div>
                  <div className="rounded-xl border px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Dates
                    </p>
                    <p className="mt-2 font-medium">
                      {formatScheduleDateRange(
                        data.schedule.event.startDate,
                        data.schedule.event.endDate
                      )}
                    </p>
                  </div>
                  <div className="rounded-xl border px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Coverage
                    </p>
                    <p className="mt-2 font-medium">
                      {matches.length} qualification {matches.length === 1 ? "match" : "matches"}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Competition info</h3>
                    <p className="text-sm text-muted-foreground">
                      Keep pits, ceremonies, lunch, and quals in the same format as the spreadsheet.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={addInfoSection}>
                    <PlusIcon className="size-4" />
                    Add day
                  </Button>
                </div>

                <div className="space-y-4">
                  {schedule.infoSections.map((section) => (
                    <div key={section.id} className="space-y-3 rounded-2xl border p-4">
                      <div className="flex items-center gap-2">
                        <Input
                          value={section.dateLabel}
                          onChange={(event) =>
                            updateInfoSection(section.id, (current) => ({
                              ...current,
                              dateLabel: event.target.value,
                            }))
                          }
                          placeholder="Friday, Apr 10"
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            setSchedule((current) => ({
                              ...current,
                              infoSections: current.infoSections.filter(
                                (entry) => entry.id !== section.id
                              ),
                            }))
                          }
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {section.items.map((item) => (
                          <div key={item.id} className="grid gap-2 sm:grid-cols-[1fr_120px_40px]">
                            <Input
                              value={item.label}
                              onChange={(event) =>
                                updateInfoSection(section.id, (current) => ({
                                  ...current,
                                  items: current.items.map((entry) =>
                                    entry.id === item.id
                                      ? { ...entry, label: event.target.value }
                                      : entry
                                  ),
                                }))
                              }
                              placeholder="Pits Open"
                            />
                            <Input
                              value={item.time}
                              onChange={(event) =>
                                updateInfoSection(section.id, (current) => ({
                                  ...current,
                                  items: current.items.map((entry) =>
                                    entry.id === item.id
                                      ? { ...entry, time: event.target.value }
                                      : entry
                                  ),
                                }))
                              }
                              placeholder="8:00 AM"
                            />
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                updateInfoSection(section.id, (current) => ({
                                  ...current,
                                  items: current.items.filter((entry) => entry.id !== item.id),
                                }))
                              }
                            >
                              <Trash2Icon className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Button variant="outline" size="sm" onClick={() => addInfoItem(section.id)}>
                        <PlusIcon className="size-4" />
                        Add item
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="match-sets" className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Match sets</h3>
                    <p className="text-sm text-muted-foreground">
                      Group matches the same way the sheet does, with one event coordinator per set.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={addShiftSection}>
                    <PlusIcon className="size-4" />
                    Add set
                  </Button>
                </div>

                <div className="space-y-4">
                  {schedule.shiftSections.length === 0 ? (
                    <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                      No match sets configured yet.
                    </p>
                  ) : (
                    schedule.shiftSections.map((shift) => (
                      <div key={shift.id} className="space-y-3 rounded-2xl border p-4">
                        <div className="flex items-center gap-2">
                          <Input
                            value={shift.label}
                            onChange={(event) =>
                              updateShiftSection(shift.id, (current) => ({
                                ...current,
                                label: event.target.value,
                              }))
                            }
                            placeholder="Friday afternoon"
                          />
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              setSchedule((current) => ({
                                ...current,
                                shiftSections: current.shiftSections.filter(
                                  (entry) => entry.id !== shift.id
                                ),
                              }))
                            }
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Start match</Label>
                            <Input
                              type="number"
                              value={shift.startMatch}
                              onChange={(event) =>
                                updateShiftSection(shift.id, (current) => ({
                                  ...current,
                                  startMatch: Number(event.target.value) || current.startMatch,
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End match</Label>
                            <Input
                              type="number"
                              value={shift.endMatch}
                              onChange={(event) =>
                                updateShiftSection(shift.id, (current) => ({
                                  ...current,
                                  endMatch: Number(event.target.value) || current.endMatch,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Event coordinator</Label>
                          <Select
                            value={shift.coordinatorMemberId ?? "__none__"}
                            onValueChange={(value) =>
                              updateShiftSection(shift.id, (current) => ({
                                ...current,
                                coordinatorMemberId: value === "__none__" ? null : value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a coordinator" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Unassigned</SelectItem>
                              {data.members.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {!detailsMode && visibleInfoSections.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Event timeline</CardTitle>
            <CardDescription>
              Key competition times are kept in the same day-by-day format as the sheet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScheduleInfoPreview sections={visibleInfoSections} />
          </CardContent>
        </Card>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className={cn("grid gap-6", "xl:grid-cols-[248px_minmax(0,1fr)]")}>
          <RosterSidebar
            canEdit={canEdit}
            filteredMembers={filteredMembers}
            memberSearch={memberSearch}
            onMemberSearchChange={setMemberSearch}
          />

          <section className="order-1 min-w-0 space-y-8 xl:order-2">
            {matches.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="font-medium">No qualification matches found for this event yet.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sync the event schedule from TBA first, then come back to assign scouts.
                  </p>
                </CardContent>
              </Card>
            ) : (
              groupedMatches.map((group) => (
                <ShiftGroup
                  key={group.id}
                  group={group}
                  canEdit={canEdit}
                  memberMap={memberMap}
                  pendingAssignmentKey={pendingAssignmentKey}
                  onOpenPicker={setPickerTarget}
                  onAssignMember={handleSeatAssignment}
                />
              ))
            )}
          </section>
        </div>
      </DndContext>

      <CommandDialog
        open={pickerTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPickerTarget(null);
          }
        }}
        title={pickerTitle}
        description="Search for a scout to place into this match seat."
      >
        <CommandInput placeholder="Search scouts by name or email..." />
        <CommandList>
          <CommandEmpty>No matching scouts found.</CommandEmpty>
          <CommandGroup heading="Organization members">
            {data.members.map((member) => (
              <CommandItem
                key={member.id}
                value={`${member.name} ${member.email} ${roleLabel(member.role)}`}
                onSelect={() => {
                  if (!pickerTarget) return;
                  if (pickerTarget.kind === "coordinator" && pickerTarget.shiftId) {
                    assignCoordinator(pickerTarget.shiftId, member.id);
                    setPickerTarget(null);
                    return;
                  }

                  if (
                    pickerTarget.kind === "seat" &&
                    pickerTarget.teamMatchId &&
                    pickerTarget.slotIndex
                  ) {
                    assignMember(pickerTarget.teamMatchId, pickerTarget.slotIndex, member.id);
                  }
                }}
              >
                <ScheduleMemberAvatar member={member} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{member.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </main>
  );
}
