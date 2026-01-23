// biome-ignore assist/source/organizeImports: <exlanation>
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card } from "@repo/ui/components/card";
import { auth } from "@/lib/auth";
import { SignInForm } from "./SignInForm";



export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const params = await searchParams;
  const redirectUrl = params.redirect;

  if (!session?.user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold">Welcome to Polar Edge Analytics</h1>
          <p className="text-muted-foreground">Sign in with Discord to continue</p>
          <SignInForm />
        </div>
      </main>
    );
  }

  // If there's a redirect URL and user is signed in, redirect them
  if (redirectUrl) {
    redirect(decodeURIComponent(redirectUrl));
  }

  return (
    <main className="container mx-auto p-8">
          
      <Card>
        <h1 className="text-2xl font-bold mb-4">Welcome to Polar Edge Analytics!</h1>
        <p>Hello, {session.user.name || session.user.email}!</p>
      </Card>
    </main>
  );
}
