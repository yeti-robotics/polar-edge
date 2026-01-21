import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getRoleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  switch (role) {
    case "owner":
      return "default";
    case "admin":
      return "secondary";
    default:
      return "outline";
  }
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined</TableHead>
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

async function MembersContent() {
  const requestHeaders = await headers();

  const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });
  const activeOrganization = activeMember?.organizationId;

  // Only admins and owners can view this page
  if (activeMember?.role !== "admin" && activeMember?.role !== "owner") {
    redirect("/");
  }
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined</TableHead>
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
              <Badge variant={getRoleBadgeVariant(memberData.role)} className="capitalize">
                {memberData.role}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(new Date(memberData.createdAt))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function MembersPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl tracking-tight">Team Members</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage and view members</p>
      </div>
      <Suspense fallback={<LoadingTable />}>
        <MembersContent />
      </Suspense>
    </main>
  );
}
