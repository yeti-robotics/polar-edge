import { headers } from "next/headers";
import { unauthorized } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { CreateOrganizationForm } from "./CreateOrganizationForm";

function LoadingCard() {
  return (
    <div className="w-full max-w-md animate-pulse">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center space-y-4">
          <div className="size-14 rounded-full bg-muted" />
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
          <div className="mt-4 w-full space-y-4">
            <div className="h-11 w-full rounded bg-muted" />
            <div className="h-11 w-full rounded bg-muted" />
            <div className="h-11 w-full rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function CreateOrganizationContent() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || !isSuperAdmin(session.user.name)) {
    unauthorized();
  }

  return <CreateOrganizationForm />;
}

export default function CreateOrganizationPage() {
  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 size-[600px] rounded-full bg-linear-to-br from-yeti-400/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 size-[600px] rounded-full bg-linear-to-tl from-yeti-600/15 to-transparent blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <Suspense fallback={<LoadingCard />}>
        <CreateOrganizationContent />
      </Suspense>
    </main>
  );
}
