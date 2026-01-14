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
<br/>
<div style={{ marginTop: '20px', marginBottom: '10px' }}>
      <Link href="/frontend">
        <Button type="button" variant="outline">
          Scouting Form
        </Button>
         </Link>
        </div>
        <br/>
        <Link href="/results">
        <Button type="button" variant="outline">
          View Results
        </Button>
        </Link>

     
    </form>
  );
}
