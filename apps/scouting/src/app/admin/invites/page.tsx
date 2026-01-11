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
import { listInviteLinks } from "@/lib/server/invite-links";
import { InviteLinkManager } from "./InviteLinkManager";
import { RevokeButton } from "./RevokeButton";

function LoadingTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invite Link</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
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
            <TableCell>
              <Skeleton className="h-8 w-20" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
  const requestHeaders = await headers();

  const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });

  // Only admins and owners can view this page
  if (activeMember?.role !== "admin" && activeMember?.role !== "owner") {
    redirect("/");
  }

  const inviteLinks = await listInviteLinks();

  return (
    <>
      <div className="mb-8">
        <InviteLinkManager />
      </div>

      {inviteLinks.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invite Link</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inviteLinks.map((link) => (
              <TableRow key={link.id}>
                <TableCell className="font-mono text-sm">
                  {(() => {
                    const baseUrl =
                      process.env.NEXT_PUBLIC_APP_URL ||
                      (process.env.VERCEL_URL
                        ? `https://${process.env.VERCEL_URL}`
                        : "http://localhost:3000");
                    const url = `${baseUrl}/join/${link.token}`;
                    return link.revoked ? (
                      <span className="text-muted-foreground line-through">{url}</span>
                    ) : (
                      <span>{url}</span>
                    );
                  })()}
                </TableCell>
                <TableCell>
                  <Badge variant={link.revoked ? "destructive" : "default"}>
                    {link.revoked ? "Revoked" : "Active"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(new Date(link.createdAt))}
                </TableCell>
                <TableCell>{!link.revoked && <RevokeButton token={link.token} />}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </>
  );
}

export default function InvitesPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl tracking-tight">Invite Links</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Generate shareable invite links for your organization
        </p>
      </div>
      <Suspense fallback={<LoadingTable />}>
        <InvitesContent />
      </Suspense>
    </main>
  );
}
