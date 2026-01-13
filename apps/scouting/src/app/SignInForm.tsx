import { Button } from "@repo/ui/components/button";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

interface SignInFormProps {
  redirectUrl?: string;
}

async function signIn(formData: FormData) {
  "use server";

  const redirectUrl = formData.get("redirectUrl")?.toString() || "/";

  const response = await auth.api.signInSocial({
    body: {
      provider: "discord",
      callbackURL: redirectUrl,
    },
    headers: await headers(),
  });

  if (response?.url) {
    redirect(response.url);
  }
}

export function SignInForm({ redirectUrl }: SignInFormProps) {
  return (
    <form action={signIn}>
      <input type="hidden" name="redirectUrl" value={redirectUrl ?? "/"} />

      <Button type="submit">Sign in with Discord</Button>

      <Link href="/frontend">
        <Button type="button" variant="outline">
          View Frontend
        </Button>
      </Link>
    </form>
  );
}
