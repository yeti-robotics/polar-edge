"use client";
import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { TypographyMuted } from "@repo/ui/components/typography";
import { EyeIcon, PencilIcon } from "lucide-react";

type AdminEditingProps = {
  isAdmin: boolean;
};

export default function AdminEditing({ isAdmin }: AdminEditingProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-6">
          <div>
            <p className="text-sm font-medium text-foreground">Schedule access</p>
            <TypographyMuted className="mt-1">
              View-only access. Ask an admin to update shifts.
            </TypographyMuted>
          </div>
          <Button variant="secondary" disabled>
            <EyeIcon className="size-4 mr-2" />
            View Only
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              {isEditing ? "Editing enabled" : "Schedule controls"}
            </p>
            <TypographyMuted className="mt-1">
              {isEditing
                ? "Make adjustments to the shift schedule and save when you are done."
                : "Admins can edit the scouting schedule for the active event."}
            </TypographyMuted>
          </div>
          <Button onClick={() => setIsEditing((value) => !value)}>
            <PencilIcon className="size-4 mr-2" />
            {isEditing ? "Stop Editing" : "Edit Schedule"}
          </Button>
        </div>
        {isEditing && (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Editing tools will appear here.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
