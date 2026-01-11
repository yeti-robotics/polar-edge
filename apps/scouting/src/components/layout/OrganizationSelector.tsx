"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function OrganizationSelector() {
  const { data: organizations } = authClient.useListOrganizations();
  const { data: currentOrganization } = authClient.useActiveOrganization();
  const router = useRouter();

  return (
    <Select
      value={currentOrganization?.id}
      onValueChange={async (value) => {
        await authClient.organization.setActive({ organizationId: value });
        router.refresh();
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select an organization" />
      </SelectTrigger>
      <SelectContent>
        {organizations?.map((organization) => (
          <SelectItem key={organization.id} value={organization.id}>
            {organization.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
