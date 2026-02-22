import { Card, CardContent } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OrganizationSettingsForm } from "@/features/org/settings/components/OrganizationSettingsForm";
import { auth } from "@/lib/auth";
import { requireAdminMember } from "@/lib/server/auth/require-member";

function LoadingForm() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-10 w-full max-w-[320px]" />
        <Skeleton className="mt-4 h-10 w-full max-w-[320px]" />
        <Skeleton className="mt-4 h-9 w-20" />
      </CardContent>
    </Card>
  );
}

async function SettingsContent() {
  const activeMember = await requireAdminMember();
  const requestHeaders = await headers();

  const organizationId = activeMember.organizationId;
  const org = await auth.api.getFullOrganization({
    query: { organizationId },
    headers: requestHeaders,
  });

  if (!org) {
    notFound();
  }

  return (
    <OrganizationSettingsForm organizationId={organizationId} name={org.name} slug={org.slug} />
  );
}

export default function AdminSettingsPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">Update your organization&apos;s name and logo</p>
      </div>
      <Suspense fallback={<LoadingForm />}>
        <SettingsContent />
      </Suspense>
    </main>
  );
}
