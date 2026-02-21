import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { TypographyH1, TypographyH3, TypographyMuted } from "@repo/ui/components/typography";
import { headers } from "next/headers";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { SignInForm } from "./SignInForm";

async function AllowSuperPerms() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !isSuperAdmin(session.user.email)) {
    return null;
  }

  return (
    <div>
      <Link href="/organization/create">
        <Button> Create Organization </Button>
      </Link>
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ signup?: string; redirect?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { signup: signupParam, redirect: redirectParam } = await searchParams;

  if (!session?.user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="flex flex-col items-center gap-4">
          <TypographyH1>Welcome to Polar Edge Analytics</TypographyH1>
          {signupParam === "restricted" && (
            <p className="rounded-md bg-destructive/15 px-4 py-2 text-sm text-destructive">
              Sign-up is invite-only. Use an invite link from your organization or contact an admin.
            </p>
          )}
          <TypographyMuted>Sign in to continue</TypographyMuted>
          <SignInForm redirectUrl={redirectParam} />
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-8">
      <Card className="container">
        <TypographyH3 className="mb-4">Welcome to Polar Edge Analytics!</TypographyH3>
        <p>Hello, {session.user.name || session.user.email}!</p>

        <AllowSuperPerms />
      </Card>
    </main>
  );
}
