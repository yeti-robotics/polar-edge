import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { TypographyH1, TypographyMuted } from "@repo/ui/components/typography";
import { headers } from "next/headers";
import { Suspense } from "react";
import { RemoveMemberButton } from "@/features/org/members/components/RemoveMemberButton";
import { RoleSelect } from "@/features/org/members/components/RoleSelect";
import { auth } from "@/lib/auth";
import { requireAdminMember } from "@/lib/server/auth/require-member";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function LoadingTable() {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-25">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {["a", "b", "c", "d", "e"].map((id) => (
            <TableRow key={id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-16" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

async function MembersContent() {
  const activeMember = await requireAdminMember();
  const requestHeaders = await headers();
  const activeOrganization = activeMember.organizationId;

  // Fetch organization details and members in parallel
  const [_organization, membersResponse] = await Promise.all([
    auth.api.getFullOrganization({
      query: { organizationId: activeOrganization },
      headers: requestHeaders,
    }),
    auth.api.listMembers({
      query: {
        organizationId: activeOrganization,
        sortBy: "createdAt",
        sortDirection: "asc",
      },
      headers: requestHeaders,
    }),
  ]);

  const members = membersResponse?.members ?? [];

  // Helper function to check if the active member can remove another member
  const canRemoveMember = (targetMemberRole: string) => {
    // Owner cannot be removed
    if (targetMemberRole === "owner") {
      return false;
    }
    // Owners can remove anyone (except other owners, already checked above)
    if (activeMember.role === "owner") {
      return true;
    }
    // Admins cannot remove other admins
    if (activeMember.role === "admin" && targetMemberRole === "admin") {
      return false;
    }
    // Admins can remove members
    return activeMember.role === "admin" && targetMemberRole === "member";
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((memberData) => (
            <TableRow key={memberData.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarImage
                      src={memberData.user.image ?? undefined}
                      alt={memberData.user.name}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(memberData.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{memberData.user.name}</span>
                    <span className="text-sm text-muted-foreground">{memberData.user.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <RoleSelect
                  memberId={memberData.id}
                  memberName={memberData.user.name}
                  currentRole={memberData.role}
                />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(new Date(memberData.createdAt))}
              </TableCell>
              <TableCell>
                {canRemoveMember(memberData.role) && (
                  <RemoveMemberButton memberId={memberData.id} memberName={memberData.user.name} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function MembersPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <TypographyH1>Team Members</TypographyH1>
        <TypographyMuted className="mt-2">Manage and view members</TypographyMuted>
      </div>
      <Suspense fallback={<LoadingTable />}>
        <MembersContent />
      </Suspense>
    </main>
  );
}
