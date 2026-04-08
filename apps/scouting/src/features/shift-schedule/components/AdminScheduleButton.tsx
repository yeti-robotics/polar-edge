"use client";

import { Button } from "@repo/ui/components/button";
import { PenSquareIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import type {
  ShiftScheduleEntry,
  ShiftScheduleMatchBlock,
  ShiftScheduleMemberOption,
} from "@/features/shift-schedule/types";

const ScheduleDialog = dynamic(
  () => import("./ScheduleDialog").then((module) => module.ScheduleDialog),
  { ssr: false }
);

type Props = {
  initialEntries: ShiftScheduleEntry[];
  organizationMembers: ShiftScheduleMemberOption[];
  matchBlocks: ShiftScheduleMatchBlock[];
};

export function AdminScheduleButton({ initialEntries, organizationMembers, matchBlocks }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PenSquareIcon className="size-4" />
        Manage Schedule
      </Button>
      <ScheduleDialog
        open={open}
        onOpenChange={setOpen}
        initialEntries={initialEntries}
        organizationMembers={organizationMembers}
        matchBlocks={matchBlocks}
      />
    </>
  );
}
