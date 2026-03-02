import { Badge } from "@repo/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
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
import { Suspense } from "react";
import { InviteLinkCopy } from "@/features/org/invites/components/InviteLinkCopy";
import { InviteLinkManager } from "@/features/org/invites/components/InviteLinkManager";
import { RevokeButton } from "@/features/org/invites/components/RevokeButton";
import { requireAdminMember } from "@/lib/server/auth/require-member";
import { listInviteLinks } from "@/lib/server/invite-links";

function LoadingTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite History</CardTitle>
        <CardDescription>View and manage previously generated invite links.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Invite Link</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {["a", "b", "c", "d", "e"].map((id) => (
                <TableRow key={id}>
                  <TableCell>
                    <Skeleton className="h-4 w-64" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-8 w-20" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

async function InvitesContent() {
  await requireAdminMember();

  const inviteLinks = await listInviteLinks();

  return (
    <div className="space-y-8">
      <InviteLinkManager />

      {inviteLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invite History</CardTitle>
            <CardDescription>View and manage previously generated invite links.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Invite Link</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inviteLinks.map((link) => {
                    const baseUrl =
                      process.env.NEXT_PUBLIC_APP_URL ||
                      (process.env.VERCEL_URL
                        ? `https://${process.env.VERCEL_URL}`
                        : "http://localhost:3000");
                    const url = `${baseUrl}/join/${link.token}`;
                    return (
                      <TableRow key={link.id}>
                        <TableCell>
                          <InviteLinkCopy url={url} revoked={link.revoked} />
                        </TableCell>
                        <TableCell>
                          <Badge variant={link.revoked ? "destructive" : "outline"}>
                            {link.revoked ? "Revoked" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {formatDate(new Date(link.createdAt))}
                        </TableCell>
                        <TableCell className="text-right">
                          {!link.revoked && <RevokeButton token={link.token} />}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function InvitesPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <TypographyH1>Invite Links</TypographyH1>
        <TypographyMuted className="mt-2">
          Generate shareable invite links for your organization
        </TypographyMuted>
      </div>
      <Suspense fallback={<LoadingTable />}>
        <InvitesContent />
      </Suspense>
    </main>
  );
}
