import { Badge } from "@repo/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TypographyH1, TypographyLabel, TypographyMuted } from "@repo/ui/components/typography";
import { CalendarIcon, ChevronRightIcon, MailIcon, Settings2Icon, UsersIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
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

async function AdminStats() {
  const activeMember = await requireAdminMember();
  const requestHeaders = await headers();
  const organizationId = activeMember.organizationId;

  const [org, membersResponse, inviteLinks, activeEvent] = await Promise.all([
    auth.api.getFullOrganization({ query: { organizationId }, headers: requestHeaders }),
    auth.api.listMembers({
      query: { organizationId, sortBy: "createdAt", sortDirection: "asc" },
      headers: requestHeaders,
    }),
    listInviteLinks(),
    getActiveEventForOrganization(organizationId),
  ]);

  const members = membersResponse?.members ?? [];
  const activeInvites = inviteLinks.filter((l) => !l.revoked).length;

  return (
    <div className="space-y-8">
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

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-5 pb-4">
            <TypographyLabel className="mb-1">Members</TypographyLabel>
            <p className="text-3xl font-semibold tabular-nums">{members.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <TypographyLabel className="mb-1">Active Invites</TypographyLabel>
            <p className="text-3xl font-semibold tabular-nums">{activeInvites}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <TypographyLabel className="mb-1">Event</TypographyLabel>
            <p className="mt-1 text-sm font-medium leading-tight truncate">
              {activeEvent?.event.name ?? <span className="text-muted-foreground">None set</span>}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {["a", "b", "c"].map((k) => (
          <Card key={k}>
            <CardContent className="pt-5 pb-4">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-8 w-10" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
      <Suspense fallback={<StatsSkeleton />}>
        <AdminStats />
      </Suspense>

      <div>
        <TypographyLabel className="mb-3">Quick Access</TypographyLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {navCards.map(({ href, icon: Icon, title, description }) => (
            <Link key={href} href={href} className="group">
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-muted-foreground" />
                      <CardTitle className="text-base">{title}</CardTitle>
                    </div>
                    <ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
