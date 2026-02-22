import { Badge } from "@repo/ui/components/badge";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TypographyH1, TypographyMuted } from "@repo/ui/components/typography";
import { CalendarIcon, MailIcon, Settings2Icon, UsersIcon } from "lucide-react";
import { headers } from "next/headers";
import { Suspense } from "react";
import { NavCardGrid } from "@/components/nav-card-grid";
import { StatItem, StatItemSkeleton } from "@/components/stat-item";
import { auth } from "@/lib/auth";
import { requireAdminMember } from "@/lib/server/auth/require-member";
import { listInviteLinks } from "@/lib/server/invite-links";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";

const navCards = [
  {
    href: "/admin/members",
    icon: UsersIcon,
    title: "Members",
    description: "Manage roles and remove members from your organization.",
  },
  {
    href: "/admin/invites",
    icon: MailIcon,
    title: "Invites",
    description: "Generate and revoke shareable invite links.",
  },
  {
    href: "/admin/event",
    icon: CalendarIcon,
    title: "Active Event",
    description: "Set the competition your organization is currently scouting.",
  },
  {
    href: "/admin/settings",
    icon: Settings2Icon,
    title: "Settings",
    description: "Update your organization's name and display preferences.",
  },
];

// ── Header ───────────────────────────────────────────────────────────────────

function HeaderSkeleton() {
  return (
    <div>
      <Skeleton className="h-9 w-48 mb-2" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}

async function AdminHeader() {
  const activeMember = await requireAdminMember();
  const requestHeaders = await headers();
  const org = await auth.api.getFullOrganization({
    query: { organizationId: activeMember.organizationId },
    headers: requestHeaders,
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <TypographyH1>{org?.name ?? "Admin Hub"}</TypographyH1>
        <Badge variant="secondary" className="font-mono text-xs capitalize">
          {activeMember.role}
        </Badge>
      </div>
      <TypographyMuted>
        Manage your organization&apos;s members, events, and settings.
      </TypographyMuted>
    </div>
  );
}

// ── Async stat components ────────────────────────────────────────────────────

async function MemberCountStat() {
  const activeMember = await requireAdminMember();
  const requestHeaders = await headers();
  const membersResponse = await auth.api.listMembers({
    query: {
      organizationId: activeMember.organizationId,
      sortBy: "createdAt",
      sortDirection: "asc",
    },
    headers: requestHeaders,
  });
  const members = membersResponse?.members ?? [];
  return <StatItem label="Members" value={members.length} />;
}

async function InviteCountStat() {
  const inviteLinks = await listInviteLinks();
  const activeInvites = inviteLinks.filter((l) => !l.revoked).length;
  return <StatItem label="Active Invites" value={activeInvites} />;
}

async function ActiveEventStat() {
  const activeMember = await requireAdminMember();
  const activeEvent = await getActiveEventForOrganization(
    activeMember.organizationId,
  );
  return (
    <StatItem
      label="Event"
      value={
        activeEvent?.event.name ?? (
          <span className="text-muted-foreground">None set</span>
        )
      }
    />
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
      <Suspense fallback={<HeaderSkeleton />}>
        <AdminHeader />
      </Suspense>

      <div className="rounded-xl border bg-muted/20 grid grid-cols-1 max-md:divide-y md:grid-cols-3">
        <div className="px-6 py-5 md:border-r">
          <Suspense fallback={<StatItemSkeleton />}>
            <MemberCountStat />
          </Suspense>
        </div>
        <div className="px-6 py-5 md:border-r">
          <Suspense fallback={<StatItemSkeleton />}>
            <InviteCountStat />
          </Suspense>
        </div>
        <div className="px-6 py-5">
          <Suspense fallback={<StatItemSkeleton />}>
            <ActiveEventStat />
          </Suspense>
        </div>
      </div>

      <NavCardGrid items={navCards} />
    </main>
  );
}
