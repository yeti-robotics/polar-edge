"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent } from "@repo/ui/components/card";
import { Separator } from "@repo/ui/components/separator";
import { TypographyMuted } from "@repo/ui/components/typography";
import { useMemo } from "react";
import type { ShiftScheduleEntry } from "@/features/shift-schedule/types";
import AdminEditSchedule from "./AdminEditSchedule";

type OrganizationMemberOption = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
};

type Props = {
  isAdmin: boolean;
  initialEntries: ShiftScheduleEntry[];
  eventName: string | null;
  activeMemberId: string;
  organizationMembers: OrganizationMemberOption[];
};

export default function ScoutingPage({
  isAdmin,
  initialEntries,
  eventName,
  activeMemberId,
  organizationMembers,
}: Props) {
  const sortedEntries = useMemo(
    () =>
      (initialEntries ?? [])
        .slice()
        .sort((a, b) => {
          const shiftCompare = (a.shift ?? "").localeCompare(b.shift ?? "");
          if (shiftCompare !== 0) return shiftCompare;
          return (a.role ?? "").localeCompare(b.role ?? "");
        }),
    [initialEntries],
  );
  const myAssignments = sortedEntries.filter((entry) => entry.memberId === activeMemberId);
  const assignedMembers = new Set(sortedEntries.map((entry) => entry.memberId).filter(Boolean)).size;

  const hasSchedule = sortedEntries.length > 0;
  const eventLabel = eventName ?? "active event";
  const getMember = (memberId: string | null) =>
    organizationMembers.find((member) => member.id === memberId);
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (!hasSchedule) {
    return (
      <Card>
        <CardContent className="space-y-4 py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Schedule for {eventLabel}</p>
              <TypographyMuted>
                {isAdmin
                  ? "Create assignments for scouts in your organization."
                  : "An admin has not published assignments for this event yet."}
              </TypographyMuted>
            </div>
            {isAdmin ? (
              <AdminEditSchedule
                initialEntries={sortedEntries}
                organizationMembers={organizationMembers}
              />
            ) : null}
          </div>

          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            No scouting assignments have been published yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-muted-foreground">Assignments</p>
            <p className="mt-2 text-3xl font-semibold">{sortedEntries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-muted-foreground">Assigned Scouts</p>
            <p className="mt-2 text-3xl font-semibold">{assignedMembers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-muted-foreground">Your Assignments</p>
            <p className="mt-2 text-3xl font-semibold">{myAssignments.length}</p>
          </CardContent>
        </Card>
      </div>

      {myAssignments.length > 0 ? (
        <Card>
          <CardContent className="space-y-4 py-6">
            <div>
              <p className="text-sm font-medium">Your schedule</p>
              <TypographyMuted>These are the assignments currently tied to your membership.</TypographyMuted>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {myAssignments.map((entry) => (
                <div key={entry.id} className="rounded-xl border bg-primary/5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{entry.role || "Scouting role"}</p>
                    <Badge>{entry.shift || "Shift TBD"}</Badge>
                  </div>
                  {entry.notes ? (
                    <p className="mt-3 text-sm text-muted-foreground">{entry.notes}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="py-6 space-y-4">
          <div>
            <p className="text-sm font-medium">Schedule for {eventLabel}</p>
            <TypographyMuted>
              {isAdmin
                ? "Manage assignments for your organization and publish updates for the active event."
                : "View the full scouting schedule for your organization."}
            </TypographyMuted>
          </div>

          {isAdmin ? (
            <AdminEditSchedule initialEntries={sortedEntries} organizationMembers={organizationMembers} />
          ) : null}

          <Separator />

          <div className="grid gap-3">
            {sortedEntries.map((entry) => {
              const member = getMember(entry.memberId ?? null);
              const isMine = entry.memberId === activeMemberId;

              return (
                <div
                  key={entry.id}
                  className="rounded-xl border p-4 text-sm shadow-sm transition-colors"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage
                          src={member?.image ?? undefined}
                          alt={entry.name || "Assigned scout"}
                        />
                        <AvatarFallback>{getInitials(entry.name || "U A")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{entry.name || "Unassigned"}</p>
                          {isMine ? <Badge variant="secondary">You</Badge> : null}
                        </div>
                        <p className="text-muted-foreground">
                          {entry.email ?? "No email on file"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{entry.role || "Role TBD"}</Badge>
                      <Badge>{entry.shift || "Shift TBD"}</Badge>
                    </div>
                  </div>

                  {entry.notes ? (
                    <p className="mt-3 text-muted-foreground">{entry.notes}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
