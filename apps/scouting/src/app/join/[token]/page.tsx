import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { AcceptInviteLinkForm } from "@/features/org/invites/components/AcceptInviteLinkForm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { organization } from "@/lib/database/schema/tables";
import { getInviteLinkByToken } from "@/lib/server/invite-links";

async function getOrganization(organizationId: string) {
  const org = await db
    .select()
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  return org[0] || null;
}

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inviteLink = await getInviteLinkByToken(token);

  if (!inviteLink) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invite Link</CardTitle>
            <CardDescription>This invite link is invalid or does not exist.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (inviteLink.revoked) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invite Link Revoked</CardTitle>
            <CardDescription>
              This invite link has been revoked and is no longer valid.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const org = await getOrganization(inviteLink.organizationId);

  if (!org) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Organization Not Found</CardTitle>
            <CardDescription>
              The organization associated with this invite link no longer exists.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  // Check if user is already a member
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (session?.user) {
    try {
      const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });
      if (activeMember?.organizationId === inviteLink.organizationId) {
        return (
          <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Already a Member</CardTitle>
                <CardDescription>
                  You are already a member of <strong>{org.name}</strong>.
                </CardDescription>
              </CardHeader>
            </Card>
          </main>
        );
      }
    } catch {
      // User is signed in but has no active organization yet (e.g. during sign-up flow)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join Organization</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join <strong>{org.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AcceptInviteLinkForm token={token} organizationName={org.name} organizationId={org.id} />
        </CardContent>
      </Card>
    </main>
  );
}
