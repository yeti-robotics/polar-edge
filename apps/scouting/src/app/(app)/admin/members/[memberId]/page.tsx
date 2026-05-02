import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TypographyH1, TypographyLabel, TypographyMuted } from "@repo/ui/components/typography";
import { CalendarIcon, ChevronLeftIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MemberFormsTable } from "@/features/scout-audit/components/MemberFormsTable";
import {
  MemberSummaryStats,
  MemberSummaryStatsSkeleton,
} from "@/features/scout-audit/components/MemberSummaryStats";
import { getMemberFormSummary, getMemberStandForms } from "@/features/scout-audit/queries";
import { EventSwitcher } from "@/features/validation/components/EventSwitcher";
import { auth } from "@/lib/auth";
import { routes } from "@/lib/routes";
import { requireAdminMember } from "@/lib/server/auth/require-member";
import {
  getActiveEventForOrganization,
  listOrganizationEvents,
} from "@/lib/server/organization/active-event";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  scout_lead: "Scout Lead",
  member: "Member",
};

type PageProps = {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ eventId?: string }>;
};

async function SummarySection({
  eventId,
  memberId,
  organizationId,
}: {
  eventId: string;
  memberId: string;
  organizationId: string;
}) {
  const summary = await getMemberFormSummary(eventId, memberId, organizationId);
  return <MemberSummaryStats summary={summary} />;
}

async function FormsSection({
  eventId,
  memberId,
  organizationId,
}: {
  eventId: string;
  memberId: string;
  organizationId: string;
}) {
  const forms = await getMemberStandForms(eventId, memberId, organizationId);
  return <MemberFormsTable forms={forms} memberId={memberId} />;
}

export default async function MemberAuditPage({ params, searchParams }: PageProps) {
  const activeMember = await requireAdminMember();
  const { organizationId } = activeMember;
  const requestHeaders = await headers();

  const [{ memberId }, { eventId: searchEventId }, activeEvent, orgEvents, memberResponse] =
    await Promise.all([
      params,
      searchParams,
      getActiveEventForOrganization(organizationId),
      listOrganizationEvents(organizationId),
      auth.api.listMembers({
        query: { organizationId },
        headers: requestHeaders,
      }),
    ]);

  const memberData = memberResponse?.members.find((m) => m.id === memberId);
  if (!memberData) notFound();

  const validEvent =
    orgEvents.find((e) => e.id === searchEventId) ??
    (activeEvent ? orgEvents.find((e) => e.id === activeEvent.eventId) : null) ??
    null;

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <Link
        href={routes.admin.members}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeftIcon className="size-4" />
        All Members
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarImage src={memberData.user.image ?? undefined} alt={memberData.user.name} />
            <AvatarFallback>{getInitials(memberData.user.name)}</AvatarFallback>
          </Avatar>
          <div>
            <TypographyLabel>Scout</TypographyLabel>
            <TypographyH1>{memberData.user.name}</TypographyH1>
            <div className="flex items-center gap-2 mt-1">
              <TypographyMuted>{memberData.user.email}</TypographyMuted>
              <span className="text-muted-foreground">·</span>
              <TypographyMuted>joined {formatDate(new Date(memberData.createdAt))}</TypographyMuted>
              <Badge variant="secondary" className="font-mono text-xs capitalize ml-1">
                {roleLabels[memberData.role] ?? memberData.role}
              </Badge>
            </div>
          </div>
        </div>

        {orgEvents.length > 0 && validEvent && (
          <Suspense>
            <EventSwitcher
              events={orgEvents.map((e) => ({ id: e.id, name: e.name, eventCode: e.eventCode }))}
              selectedEventId={validEvent.id}
            />
          </Suspense>
        )}
      </div>

      {!validEvent ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <CalendarIcon className="size-10 text-muted-foreground" />
            <div>
              <p className="font-semibold">No active event</p>
              <TypographyMuted className="mt-1">
                Set an active event to view stand forms.
              </TypographyMuted>
            </div>
            <Link
              href={routes.admin.event}
              className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground"
            >
              Go to Active Event settings
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Suspense fallback={<MemberSummaryStatsSkeleton />}>
            <SummarySection
              eventId={validEvent.id}
              memberId={memberId}
              organizationId={organizationId}
            />
          </Suspense>

          <Suspense
            fallback={
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            }
          >
            <FormsSection
              eventId={validEvent.id}
              memberId={memberId}
              organizationId={organizationId}
            />
          </Suspense>
        </div>
      )}
    </main>
  );
}
