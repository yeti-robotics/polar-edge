"use client";

import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { toast } from "@repo/ui/components/sonner";
import { useActionState, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { type UpdateOrganizationNameState, updateOrganizationNameAction } from "./actions";

const initialState: UpdateOrganizationNameState = { data: null, error: null };

export function OrganizationSettingsForm({
  organizationId,
  name,
  slug,
}: {
  organizationId: string;
  name: string;
  slug: string;
}) {
  const [currentName, setCurrentName] = useState(name);
  const [state, formAction, isPending] = useActionState(updateOrganizationNameAction, initialState);
  const prevState = useRef(state);

  useEffect(() => {
    if (state === prevState.current) return;
    prevState.current = state;

    if (state.error) {
      toast.error(state.error);
    } else if (state.data?.success) {
      toast.success("Organization name updated");
      authClient.organization.setActive({ organizationId });
    }
  }, [state]);

  const trimmedName = currentName.trim();
  const isDisabled = !trimmedName || trimmedName.length > 100 || trimmedName === name;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
        <CardDescription>
          Update your organization&apos;s name. The slug is read-only and used for invite links.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="organizationId" value={organizationId} />
          <div className="space-y-2">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              name="name"
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)}
              className="w-full sm:w-[320px]"
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-slug">Slug</Label>
            <Input id="org-slug" value={slug} disabled className="w-full sm:w-[320px]" />
          </div>
          <div>
            <Button type="submit" disabled={isPending || isDisabled}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
