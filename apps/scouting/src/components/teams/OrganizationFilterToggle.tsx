"use client";

import { Label } from "@repo/ui/components/label";
import { Switch } from "@repo/ui/components/switch";
import { useRouter, useSearchParams } from "next/navigation";

export function OrganizationFilterToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterByOrg = searchParams.get("filterByOrg") === "true";

  const handleToggle = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set("filterByOrg", "true");
    } else {
      params.set("filterByOrg", "false");
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-2">
      <Switch id="org-filter" checked={filterByOrg} onCheckedChange={handleToggle} />
      <Label htmlFor="org-filter" className="cursor-pointer">
        Show only my organization
      </Label>
    </div>
  );
}
