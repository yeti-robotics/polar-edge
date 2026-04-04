"use client";

import { Button } from "@repo/ui/components/button";
import { PenSquareIcon } from "lucide-react";
import { useState } from "react";
import type { ShiftScheduleEntry } from "@/features/shift-schedule/types";
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
};

export default function AdminEditSchedule({ initialEntries, organizationMembers }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>
        <PenSquareIcon className="size-4" />
        Manage Assignments
      </Button>

      <ScheduleDialog
        open={open}
        onOpenChange={setOpen}
        initialEntries={initialEntries}
        organizationMembers={organizationMembers}
      />
    </div>
  );
}
