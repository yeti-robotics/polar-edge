"use client";

import { Button } from "@repo/ui/components/button";
import { useState } from "react";
import { ScheduleDialog } from "./ScheduleDialog";

export default function AdminEditSchedule() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Edit Access</Button>

      <ScheduleDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
