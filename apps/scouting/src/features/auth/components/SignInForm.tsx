"use client";

import { Button } from "@repo/ui/components/button";
import { KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Discord } from "@/components/logo/discord";
import { authClient } from "@/lib/auth-client";
import { routes } from "@/lib/routes";
import { signInDiscord } from "../actions";

async function signInPasskey() {
  await authClient.signIn.passkey({
    fetchOptions: {
      onSuccess(_context) {
        window.location.href = routes.analysis.root;
      },
      onError(context) {
        console.error("Authentication failed:", context.error.message);
      },
    },
  });
}

interface SignInFormProps {
  redirectUrl?: string;
}

export function SignInForm({ redirectUrl }: SignInFormProps) {
  const [hasPasskeySupport, setHasPasskeySupport] = useState(true);

  useEffect(() => {
    setHasPasskeySupport(typeof window !== "undefined" && "PublicKeyCredential" in window);
  }, [hasPasskeySupport]);

  const callbackURL = redirectUrl ?? routes.analysis.root;

  return (
    <div className="relative flex flex-col items-center justify-center gap-3">
      <Button
        className="w-full bg-[#5865F2] text-white hover:bg-[#4752C4]"
        onClick={() => signInDiscord(callbackURL)}
      >
        <Discord /> Sign in with Discord
      </Button>
      {hasPasskeySupport && (
        <>
          <div className="relative flex w-full items-center py-1">
            <div className="flex-1 border-t border-border" />
            <span className="px-3 text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={signInPasskey}>
            <KeyRound /> Sign in with Passkey
          </Button>
        </>
      )}
    </div>
  );
}
