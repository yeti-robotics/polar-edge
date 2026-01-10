"use client";

import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { BuildingIcon, CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

interface OrganizationSelectorClientProps {
  organizations: Organization[];
  activeOrganizationId: string | null;
  isSuperAdmin: boolean;
}

export function OrganizationSelectorClient({
  organizations,
  activeOrganizationId,
  isSuperAdmin,
}: OrganizationSelectorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const activeOrganization = organizations.find((org) => org.id === activeOrganizationId);
  const hasMultipleOrgs = organizations.length > 1;
  const showDropdown = hasMultipleOrgs || isSuperAdmin;

  async function handleSwitchOrganization(orgId: string) {
    if (orgId === activeOrganizationId) return;

    startTransition(async () => {
      await authClient.organization.setActive({ organizationId: orgId });
      const org = organizations.find((o) => o.id === orgId);
      if (org) {
        router.push(`/${org.slug}`);
        router.refresh();
      }
    });
  }

  async function handleCreateOrganization() {
    if (!newOrgName.trim() || !newOrgSlug.trim()) return;

    setIsCreating(true);
    try {
      const result = await authClient.organization.create({
        name: newOrgName.trim(),
        slug: newOrgSlug.trim().toLowerCase().replace(/\s+/g, "-"),
      });

      if (result.data) {
        setCreateDialogOpen(false);
        setNewOrgName("");
        setNewOrgSlug("");
        router.push(`/${result.data.slug}`);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to create organization:", error);
    } finally {
      setIsCreating(false);
    }
  }

  function handleNameChange(name: string) {
    setNewOrgName(name);
    // Auto-generate slug from name
    setNewOrgSlug(
      name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
    );
  }

  // If user has no orgs and can't create, show nothing
  if (organizations.length === 0 && !isSuperAdmin) {
    return null;
  }

  // If user has only one org and can't create more, just show the org name
  if (!showDropdown && organizations.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium">
        <BuildingIcon className="size-4 text-muted-foreground" />
        <span>{activeOrganization?.name ?? organizations[0]?.name ?? "Select Organization"}</span>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between gap-2" disabled={isPending}>
            <span className="flex items-center gap-2 truncate">
              <BuildingIcon className="size-4 shrink-0" />
              <span className="truncate">{activeOrganization?.name ?? "Select Organization"}</span>
            </span>
            <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {organizations.length > 0 && (
            <>
              <DropdownMenuLabel>Organizations</DropdownMenuLabel>
              {organizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleSwitchOrganization(org.id)}
                  className="cursor-pointer"
                >
                  <span className="flex-1 truncate">{org.name}</span>
                  {org.id === activeOrganizationId && <CheckIcon className="size-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </>
          )}
          {isSuperAdmin && (
            <>
              {organizations.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={() => setCreateDialogOpen(true)}
                className="cursor-pointer"
              >
                <PlusIcon className="size-4" />
                <span>Create Organization</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Create a new organization to manage teams and scouting data.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                placeholder="FRC Team 1234"
                value={newOrgName}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="org-slug">URL Slug</Label>
              <Input
                id="org-slug"
                placeholder="frc-team-1234"
                value={newOrgSlug}
                onChange={(e) => setNewOrgSlug(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This will be used in URLs: /{newOrgSlug || "your-slug"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrganization}
              disabled={!newOrgName.trim() || !newOrgSlug.trim() || isCreating}
            >
              {isCreating ? "Creating..." : "Create Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
