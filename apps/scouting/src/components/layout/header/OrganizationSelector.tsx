"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { routes } from "@/lib/routes";

interface OrganizationSelectorProps {
  isSuperAdmin?: boolean;
}

export function OrganizationSelector({ isSuperAdmin = false }: OrganizationSelectorProps) {
  const { data: organizations } = authClient.useListOrganizations();
  const { data: currentOrganization } = authClient.useActiveOrganization();
  const router = useRouter();

  const hasOrganizations = (organizations?.length ?? 0) > 0;
  const shouldShowDropdown = (organizations?.length ?? 0) > 1 || isSuperAdmin;

  if (!hasOrganizations) {
    return (
      <div className="flex items-center">
        {isSuperAdmin ? (
          <Link
            href={routes.organization.create}
            className="flex items-center text-sm text-foreground hover:text-foreground/80 transition-colors gap-1"
          >
            <PlusIcon className="size-3.5" aria-hidden="true" />
            Create Organization
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">No organization</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Avatar className="size-6">
          <AvatarImage
            src={currentOrganization?.logo ?? ""}
            alt={currentOrganization?.name ?? ""}
          />
          <AvatarFallback className="text-xs">
            {currentOrganization?.name?.charAt(0) ?? ""}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm">{currentOrganization?.name}</span>
      </div>
      {shouldShowDropdown ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" className="size-6 p-0" aria-label="Switch organization">
              <ChevronsUpDownIcon className="size-3.5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start" className="w-48">
            {organizations?.map((organization) => (
              <DropdownMenuItem
                key={organization.id}
                onClick={async () => {
                  await authClient.organization.setActive({ organizationId: organization.id });
                  router.refresh();
                }}
              >
                <Avatar className="size-8">
                  <AvatarImage src={organization.logo ?? ""} alt={organization.name} />
                  <AvatarFallback>{organization.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{organization.name}</span>
              </DropdownMenuItem>
            ))}
            {isSuperAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={routes.organization.create} className="flex items-center gap-2">
                    <PlusIcon className="size-4" aria-hidden="true" />
                    <span className="text-sm">Create Organization</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
