import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AcceptInvitationForm } from "./AcceptInvitationForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";

async function getInvitation(invitationId: string) {
  const requestHeaders = await headers();

  try {
    const invitation = await auth.api.getInvitation({
      query: {
        id: invitationId,
      },
      headers: requestHeaders,
    });

    return invitation;
  } catch (error) {
    return null;
  }
}

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invitation = await getInvitation(id);

  if (!invitation) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation Not Found</CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  // Check if invitation is expired
  const isExpired = new Date(invitation.expiresAt) < new Date();
  const isAccepted = invitation.status === "accepted";

  if (isExpired) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation Expired</CardTitle>
            <CardDescription>
              This invitation link has expired. Please request a new invitation.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (isAccepted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation Already Accepted</CardTitle>
            <CardDescription>
              This invitation has already been accepted. You can access the organization from your
              dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join <strong>{invitation.organization.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AcceptInvitationForm invitationId={id} organizationName={invitation.organization.name} />
        </CardContent>
      </Card>
    </main>
  );
}
