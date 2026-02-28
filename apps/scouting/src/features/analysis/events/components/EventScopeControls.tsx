"use client";

import { Label } from "@repo/ui/components/label";
import { Switch } from "@repo/ui/components/switch";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  hasOrg: boolean;
};

export function EventScopeControls({ hasOrg }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgScope = searchParams.get("orgScope") === "1";

  const handleOrgScopeChange = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set("orgScope", "1");
    } else {
      params.delete("orgScope");
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  if (!hasOrg) return null;

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="org-scope" className="text-sm text-muted-foreground">
        My Organization Only
      </Label>
      <Switch id="org-scope" size="sm" checked={orgScope} onCheckedChange={handleOrgScopeChange} />
    </div>
  );
}
