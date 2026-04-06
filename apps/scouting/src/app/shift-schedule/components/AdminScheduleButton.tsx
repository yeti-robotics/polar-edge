"use client";

import { Button } from "@repo/ui/components/button";
import { PenSquareIcon } from "lucide-react";
import { useState } from "react";
import type { ShiftScheduleEntry, ShiftScheduleMatchBlock } from "@/features/shift-schedule/types";
import { ScheduleDialog } from "./ScheduleDialog";

type OrganizationMemberOption = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
};

type Props = {
  initialEntries: ShiftScheduleEntry[];
  organizationMembers: OrganizationMemberOption[];
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
