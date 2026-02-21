"use client";

import { Button } from "@repo/ui/components/button";
import { TypographyH3, TypographyMuted } from "@repo/ui/components/typography";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { routes } from "@/lib/routes";
import { acceptInviteLink, setPendingInviteCookie } from "./actions";

interface AcceptInviteLinkFormProps {
  token: string;
  organizationName: string;
  organizationId: string;
}

export function AcceptInviteLinkForm({
  token,
  organizationName,
  organizationId,
}: AcceptInviteLinkFormProps) {
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
        // Set cookie before redirecting so OAuth callback knows about the invite
        await setPendingInviteCookie(token);
        const currentUrl = window.location.href;
        router.push(`${routes.home}?redirect=${encodeURIComponent(currentUrl)}`);
        return;
      }

      const result = await acceptInviteLink(token);

      if (result.error) {
        setError(result.error);
        setIsAccepting(false);
        return;
      }

      setSuccess(true);
      // Set the newly joined org as active so Better Auth's client-side
      // reactive store invalidates immediately (fixes stale org in header).
      await authClient.organization.setActive({ organizationId });
      setTimeout(() => {
        router.refresh();
        router.push(routes.home);
      }, 1500);
    } catch (_err) {
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
        <TypographyH3 className="mt-6">Joined Successfully!</TypographyH3>
        <TypographyMuted className="mt-2 text-center">
          You&apos;ve successfully joined {organizationName}. Redirecting you now...
        </TypographyMuted>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Click the button below to join this organization as a member.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <Button onClick={handleAccept} disabled={isAccepting} className="w-full">
        {isAccepting ? (
          <>
            <Loader2Icon className="mr-2 size-4 animate-spin" />
            Joining...
          </>
        ) : (
          "Join Organization"
        )}
      </Button>
    </div>
  );
}
