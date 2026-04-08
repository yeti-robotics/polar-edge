import { TypographyLabel, TypographyMuted } from "@repo/ui/components/typography";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignInForm } from "@/features/auth/components/SignInForm";
import { auth } from "@/lib/auth";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Log in — Polar Edge",
};

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ signup?: string; redirect?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    redirect(routes.analysis.root);
  }

  const { signup: signupParam, redirect: redirectParam } = await searchParams;

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-10">
      {/* Branding */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-3xl font-bold tracking-tight font-mono uppercase">Polar Edge</span>
        <TypographyLabel>YETI Robotics &middot; 3506</TypographyLabel>
      </div>

      {/* Card */}
      <div className="w-full space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-medium">Sign in to your account</h2>
          <TypographyMuted>Continue to scouting &amp; analysis</TypographyMuted>
        </div>

        {signupParam === "restricted" && (
          <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            Sign-up is invite-only. Use an invite link from your organization or contact an admin.
          </p>
        )}

        <SignInForm redirectUrl={redirectParam} />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 text-muted-foreground/50">
        <div className="h-px w-8 bg-border" />
        <TypographyMuted className="text-muted-foreground/50">
          FRC Scouting Platform
        </TypographyMuted>
        <div className="h-px w-8 bg-border" />
      </div>
    </div>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ signup?: string; redirect?: string }>;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 overflow-hidden">
      {/* Background accents */}
      <div className="pointer-events-none absolute -top-48 -right-48 size-[500px] rounded-full bg-primary/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-48 size-[400px] rounded-full bg-primary/[0.03] blur-3xl" />

      <Suspense>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
