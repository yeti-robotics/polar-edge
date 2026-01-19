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

  return <> </>;
}
