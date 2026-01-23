import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignInForm } from "./SignInForm";
import { Card } from "@repo/ui/components/card";

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
    <main className="container mx-auto p-18">
      <Card>
        <div className="ml-4">
          <h1 className="text-2xl font-bold mb-4 ml-4">Welcome to Polar Edge Analytics!</h1>
          <p className="ml-4">Hello, {session.user.name || session.user.email}!</p>
        </div>
      </Card>
      <div className="gap-4 mt-8">
        <Card>
          <h1 className="text-2xl font-bold mb-4 ml-4">Scouting and More </h1>
        </Card>
      </div>
    </main>
  );
}
