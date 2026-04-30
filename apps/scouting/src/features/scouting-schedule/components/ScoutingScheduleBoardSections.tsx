"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { cn } from "@repo/ui/lib/utils";
import { UsersIcon, XIcon } from "lucide-react";
import type {
  ScoutingScheduleBoardGroup,
  ScoutingScheduleBoardMatch,
  ScoutingScheduleBoardTeamSlot,
} from "../logic";
import type { ScoutingScheduleMember } from "../queries";

export type PickerTarget = {
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

export function roleLabel(role: string) {
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

export function ScheduleMemberAvatar({
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

function DraggableRosterMember({ member }: { member: ScoutingScheduleMember }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `member:${member.id}`,
    data: { memberId: member.id },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "flex w-full min-w-0 items-center gap-3 rounded-md border bg-card px-3 py-2 text-left transition-colors hover:bg-accent/20",
        isDragging && "opacity-60 shadow-lg ring-2 ring-primary/30"
      )}
      {...attributes}
      {...listeners}
    >
      <ScheduleMemberAvatar member={member} className="shrink-0" />
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium">{member.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">{roleLabel(member.role)}</p>
      </div>
      <Badge variant="outline" className="shrink-0 whitespace-nowrap px-2.5">
        Drag
      </Badge>
    </button>
  );
}

function CompactRosterMember({ member }: { member: ScoutingScheduleMember }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md border bg-card px-2.5 py-2">
      <ScheduleMemberAvatar member={member} className="size-6 shrink-0" />
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium">{member.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">{roleLabel(member.role)}</p>
      </div>
    </div>
  );
}

export function RosterSidebar({
  canEdit,
  filteredMembers,
  memberSearch,
  onMemberSearchChange,
}: {
  canEdit: boolean;
  filteredMembers: ScoutingScheduleMember[];
  memberSearch: string;
  onMemberSearchChange: (value: string) => void;
}) {
  return (
    <aside className="order-2 space-y-4 xl:order-1">
      <Card className="xl:sticky xl:top-24">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="size-4" />
            Active roster
          </CardTitle>
          <CardDescription>
            {canEdit
              ? "Drag scouts into the table or click a seat to assign."
              : "Current organization members for this event schedule."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={memberSearch}
            onChange={(event) => onMemberSearchChange(event.target.value)}
            placeholder="Search members"
          />
          <ScrollArea className="h-[12rem] xl:h-[calc(100vh-18rem)]">
            <div className="space-y-2 pr-3">
              {filteredMembers.map((member) =>
                canEdit ? (
                  <DraggableRosterMember key={member.id} member={member} />
                ) : (
                  <CompactRosterMember key={member.id} member={member} />
                )
              )}
              {filteredMembers.length === 0 && (
                <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                  No members match that search.
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </aside>
  );
}

function CoordinatorDropZone({
  shiftId,
  coordinator,
  canEdit,
  onOpenPicker,
}: {
  shiftId: string;
  coordinator: ScoutingScheduleMember | null;
  canEdit: boolean;
  onOpenPicker: (target: PickerTarget) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `coordinator:${shiftId}`,
    data: { kind: "coordinator", shiftId } satisfies PickerTarget,
    disabled: !canEdit,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => canEdit && onOpenPicker({ kind: "coordinator", shiftId })}
      disabled={!canEdit}
      className={cn(
        "flex min-h-9 w-full items-center gap-2 rounded-sm border px-2 py-1.5 text-left transition-colors",
        "border-border bg-background hover:bg-accent/10",
        isOver && "border-primary/60 bg-accent/10",
        !canEdit && "cursor-default"
      )}
    >
      <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
        EC
      </span>
      <span className="truncate text-sm font-medium">
        {coordinator?.name ?? "Assign event coordinator"}
      </span>
    </button>
  );
}

function AssignmentSeat({
  teamMatchId,
  slotIndex,
  member,
  canEdit,
  isPending,
  onOpenPicker,
  onClear,
}: {
  teamMatchId: number;
  slotIndex: 1 | 2;
  member: ScoutingScheduleMember | null;
  canEdit: boolean;
  isPending: boolean;
  onOpenPicker: (target: PickerTarget) => void;
  onClear: (target: PickerTarget) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `seat:${teamMatchId}:${slotIndex}`,
    data: { kind: "seat", teamMatchId, slotIndex } satisfies PickerTarget,
    disabled: !canEdit,
  });

  return (
    <div className="relative">
      <button
        ref={setNodeRef}
        type="button"
        disabled={!canEdit || isPending}
        onClick={() => canEdit && onOpenPicker({ kind: "seat", teamMatchId, slotIndex })}
        className={cn(
          "flex min-h-8 w-full items-center gap-2 rounded-sm border px-2 py-1.5 text-left transition-colors",
          member
            ? "border-border bg-background hover:bg-accent/10"
            : "border-border border-dashed bg-background hover:bg-accent/10",
          isOver && "border-primary/60 bg-accent/10",
          !canEdit && "cursor-default border-solid"
        )}
      >
        <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
          S{slotIndex}
        </span>
        {member ? (
          <div className="flex min-w-0 items-center gap-2">
            <ScheduleMemberAvatar member={member} className="size-6" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{member.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{roleLabel(member.role)}</p>
            </div>
          </div>
        ) : (
          <div className="min-w-0">
            <p className="text-sm font-medium">{canEdit ? "Assign scout" : "Unassigned"}</p>
          </div>
        )}
      </button>

      {member && canEdit && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="absolute top-2 right-2"
          disabled={isPending}
          onClick={() => onClear({ kind: "seat", teamMatchId, slotIndex })}
        >
          <XIcon className="size-3" />
        </Button>
      )}
    </div>
  );
}

const TEAM_COLUMNS = [
  { alliance: "red", position: 1, label: "Red 1" },
  { alliance: "red", position: 2, label: "Red 2" },
  { alliance: "red", position: 3, label: "Red 3" },
  { alliance: "blue", position: 1, label: "Blue 1" },
  { alliance: "blue", position: 2, label: "Blue 2" },
  { alliance: "blue", position: 3, label: "Blue 3" },
] as const;

function findTeamSlot(
  matchEntry: ScoutingScheduleBoardMatch,
  alliance: "red" | "blue",
  position: 1 | 2 | 3
) {
  return (
    matchEntry.teams.find((teamSlot) => teamSlot.alliance === alliance && teamSlot.position === position) ??
    null
  );
}

function TeamAssignmentCell({
  teamSlot,
  canEdit,
  memberMap,
  pendingAssignmentKey,
  onOpenPicker,
  onAssignMember,
}: {
  teamSlot: ScoutingScheduleBoardTeamSlot | null;
  canEdit: boolean;
  memberMap: Map<string, ScoutingScheduleMember>;
  pendingAssignmentKey: string | null;
  onOpenPicker: (target: PickerTarget) => void;
  onAssignMember: (target: PickerTarget, memberId: string | null) => void;
}) {
  if (!teamSlot) {
    return <div className="py-3 text-sm text-muted-foreground">Unavailable</div>;
  }

  const teamNumberClasses =
    teamSlot.alliance === "red" ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400";

  return (
    <div className="space-y-2">
      <div className="space-y-0.5">
        <p className={cn("font-mono text-xl font-bold leading-none", teamNumberClasses)}>
          {teamSlot.teamNumber}
        </p>
        <p className="truncate text-[13px] text-muted-foreground">{teamSlot.teamName}</p>
      </div>

      <div className="space-y-1">
        {teamSlot.assignments.map((assignment) => {
          const assignedMember = assignment.memberId
            ? memberMap.get(assignment.memberId) ?? null
            : null;
          const seatKey = `${teamSlot.teamMatchId}:${assignment.slotIndex}`;

          return (
            <AssignmentSeat
              key={seatKey}
              teamMatchId={teamSlot.teamMatchId}
              slotIndex={assignment.slotIndex}
              member={assignedMember}
              canEdit={canEdit}
              isPending={pendingAssignmentKey === seatKey}
              onOpenPicker={onOpenPicker}
              onClear={(target) => onAssignMember(target, null)}
            />
          );
        })}
      </div>
    </div>
  );
}

export function ShiftGroup({
  group,
  canEdit,
  memberMap,
  pendingAssignmentKey,
  onOpenPicker,
  onAssignMember,
}: {
  group: ScoutingScheduleBoardGroup;
  canEdit: boolean;
  memberMap: Map<string, ScoutingScheduleMember>;
  pendingAssignmentKey: string | null;
  onOpenPicker: (target: PickerTarget) => void;
  onAssignMember: (target: PickerTarget, memberId: string | null) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <div className="min-w-[1180px] border-b bg-card px-4 py-3">
            <div className="flex flex-wrap items-center gap-4">
              <h2 className="text-base font-semibold text-foreground">{group.label}</h2>
              {group.id !== "ungrouped" ? (
                <div className="w-full max-w-xs sm:w-[280px]">
                  <CoordinatorDropZone
                    shiftId={group.id}
                    coordinator={
                      group.coordinatorMemberId
                        ? memberMap.get(group.coordinatorMemberId) ?? null
                        : null
                    }
                    canEdit={canEdit}
                    onOpenPicker={onOpenPicker}
                  />
                </div>
              ) : null}
            </div>
          </div>
          <Table className="min-w-[1180px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 bg-card text-xs font-semibold uppercase tracking-[0.14em]">
                  Match
                </TableHead>
                {TEAM_COLUMNS.map((column) => (
                  <TableHead
                    key={`${column.alliance}-${column.position}`}
                    className={cn(
                      "w-[176px] bg-card text-left text-xs font-semibold uppercase tracking-[0.14em]",
                      column.alliance === "blue" &&
                        column.position === 1 &&
                        "border-l-4 border-muted",
                      column.alliance === "red"
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400"
                    )}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.matches.map((matchEntry, index) => (
                <TableRow key={matchEntry.matchNumber} className="align-top hover:bg-muted/20">
                  <TableCell
                    className={cn(
                      "border-r bg-card px-3 py-3 align-top",
                      index % 2 === 1 && "bg-muted/5"
                    )}
                  >
                    <div className="space-y-1">
                      <p className="font-mono text-lg font-semibold">{matchEntry.matchNumber}</p>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        QM
                      </p>
                    </div>
                  </TableCell>

                  {TEAM_COLUMNS.map((column) => (
                    <TableCell
                      key={`${matchEntry.matchNumber}-${column.alliance}-${column.position}`}
                      className={cn(
                        "bg-card px-3 py-3 align-top",
                        column.alliance === "blue" &&
                          column.position === 1 &&
                          "border-l-4 border-muted"
                      )}
                    >
                      <TeamAssignmentCell
                        teamSlot={findTeamSlot(matchEntry, column.alliance, column.position)}
                        canEdit={canEdit}
                        memberMap={memberMap}
                        pendingAssignmentKey={pendingAssignmentKey}
                        onOpenPicker={onOpenPicker}
                        onAssignMember={onAssignMember}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
