"use client";

import { Button } from "@repo/ui/components/button";
import { KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Discord } from "@/components/logo/discord";
import { authClient } from "@/lib/auth-client";
import { routes } from "@/lib/routes";
import { signInDiscord } from "./signIn";

async function signInPasskey() {
  await authClient.signIn.passkey({
    fetchOptions: {
      onSuccess(_context) {
        window.location.href = routes.home;
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

  const callbackURL = redirectUrl ?? routes.home;

  return (
    <div className="relative flex flex-col items-center justify-center my-4">
      <Button onClick={() => signInDiscord(callbackURL)}>
        <Discord /> Sign in With Discord
      </Button>
      {true && (
        <>
          <span className="relative my-4 inline-flex items-center px-4">
            <span className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-foreground"></span>
            <span className="relative bg-background px-2">or</span>
          </span>
          <Button
            className="bg-foreground text-background hover:text-foreground"
            onClick={signInPasskey}
          >
            {" "}
            <KeyRound /> Sign in With Passkey
          </Button>
        </>
      )}
    </div>
  );
}
