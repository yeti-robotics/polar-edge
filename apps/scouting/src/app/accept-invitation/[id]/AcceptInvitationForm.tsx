"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { authClient } from "@/lib/auth-client";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";

interface AcceptInvitationFormProps {
  invitationId: string;
  organizationName: string;
}

export function AcceptInvitationForm({
  invitationId,
  organizationName,
}: AcceptInvitationFormProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleAccept() {
    setIsAccepting(true);
    setError(null);

    try {
      // Check if user is signed in
      const session = await authClient.getSession();

      if (!session?.data?.user) {
        // Redirect to sign in, then back to this page
        const currentUrl = window.location.href;
        router.push(`/?redirect=${encodeURIComponent(currentUrl)}`);
        return;
      }

      const result = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (result.error) {
        setError(result.error.message ?? "Failed to accept invitation");
        setIsAccepting(false);
        return;
      }

      setSuccess(true);
      // Redirect to home page after a brief delay
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsAccepting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-green-400/30" />
          <CheckCircle2Icon className="relative size-16 text-green-500" />
        </div>
        <h3 className="mt-6 text-xl font-semibold">Invitation Accepted!</h3>
        <p className="mt-2 text-center text-muted-foreground">
          You&apos;ve successfully joined {organizationName}. Redirecting you now...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Click the button below to accept this invitation and join the organization.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <Button onClick={handleAccept} disabled={isAccepting} className="w-full">
        {isAccepting ? (
          <>
            <Loader2Icon className="mr-2 size-4 animate-spin" />
            Accepting...
          </>
        ) : (
          "Accept Invitation"
        )}
      </Button>
    </div>
  );
}
