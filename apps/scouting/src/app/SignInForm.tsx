
import { Button } from "@repo/ui/components/button";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

interface SignInFormProps {
  redirectUrl?: string;
}

async function signIn(redirectUrl?: string) {
  "use server";
  const callbackURL = redirectUrl || "/";
  const response = await auth.api.signInSocial({
    body: {
      provider: "discord",
      callbackURL,
    },
    headers: await headers(),
  });

  if (response?.url) {
    redirect(response.url);
  }
}

export function SignInForm({ redirectUrl }: SignInFormProps) {
  return (
    <form action={async () => signIn(redirectUrl)}>
      <Button type="submit">Sign in with Discord</Button>
    </form>
  );
}
