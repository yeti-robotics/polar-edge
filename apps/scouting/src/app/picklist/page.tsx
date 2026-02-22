import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TypographyH1, TypographyMuted } from "@repo/ui/components/typography";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { routes } from "@/lib/routes";
import { requireActiveMember } from "@/lib/server/auth/require-member";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";
import { CreatePicklistDialog } from "@/features/picklist/components/CreatePicklistDialog";
import { getPicklistsForEvent } from "@/features/picklist/queries";

function LoadingPicklists() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

async function PicklistContent() {
  const activeMember = await requireActiveMember();
  const activeEvent = await getActiveEventForOrganization(activeMember.organizationId);

  if (!activeEvent?.event) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No active event set. Please configure an event in admin settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  const picklists = await getPicklistsForEvent(activeMember.organizationId, activeEvent.event.id);

  if (picklists.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            No picklists yet. Create your first picklist to get started.
          </p>
          <CreatePicklistDialog>
            <Button>
              <PlusIcon className="size-4 mr-2" />
              Create Picklist
            </Button>
          </CreatePicklistDialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {picklists.map((picklist) => (
        <Link key={picklist.id} href={routes.picklist.detail(picklist.id)}>
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>{picklist.name}</CardTitle>
              <CardDescription>
                {picklist.teamCount} {picklist.teamCount === 1 ? "team" : "teams"} • Created{" "}
                {new Date(picklist.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default function PicklistPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <TypographyH1>Picklists</TypographyH1>
          <TypographyMuted className="mt-2">
            Create and manage team picklists for alliance selection
          </TypographyMuted>
        </div>
        <CreatePicklistDialog>
          <Button>
            <PlusIcon className="size-4 mr-2" />
            Create Picklist
          </Button>
        </CreatePicklistDialog>
      </div>
      <Suspense fallback={<LoadingPicklists />}>
        <PicklistContent />
      </Suspense>
    </main>
  );
}
