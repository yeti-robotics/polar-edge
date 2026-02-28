"use client";

import { Label } from "@repo/ui/components/label";
import { Switch } from "@repo/ui/components/switch";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  hasOrg: boolean;
};

export function EventSelectorControls({ hasOrg }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgOnly = searchParams.get("orgOnly") === "1";

  const handleOrgOnlyChange = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set("orgOnly", "1");
    } else {
      params.delete("orgOnly");
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  if (!hasOrg) return null;

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="org-only" className="text-sm text-muted-foreground">
        My Org Events Only
      </Label>
      <Switch
        id="org-only"
        size="sm"
        checked={orgOnly}
        onCheckedChange={handleOrgOnlyChange}
      />
    </div>
  );
}
