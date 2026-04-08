import {
  ArrowLeftRightIcon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
  ShieldIcon,
  TableIcon,
} from "lucide-react";
import { headers } from "next/headers";
import { type NavLink, NavSidebar } from "@/components/NavSidebar";
import { SidebarSheet } from "@/components/SidebarSheet";
import { auth } from "@/lib/auth";
import { routes } from "@/lib/routes";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";

async function buildEventsLink(): Promise<NavLink> {
  try {
    const activeMember = await auth.api.getActiveMember({ headers: await headers() });
    if (activeMember?.organizationId) {
      const activeOrgEvent = await getActiveEventForOrganization(activeMember.organizationId);
      if (activeOrgEvent) {
        return {
          href: routes.analysis.event(activeOrgEvent.eventId),
          label: "Event",
          icon: <TableIcon className="size-4" />,
        };
      }
    }
  } catch {
    // not signed in or no org
  }
  return { href: routes.analysis.events, label: "Events", icon: <TableIcon className="size-4" /> };
}

export default async function DataLayout({ children }: { children: React.ReactNode }) {
  const eventsLink = await buildEventsLink();

  let isAuthenticated = false;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    isAuthenticated = !!session?.user;
  } catch {
    // not signed in
  }

  const analysisLinks: NavLink[] = [
    {
      href: routes.analysis.root,
      label: "Overview",
      icon: <LayoutDashboardIcon className="size-4" />,
      exact: true,
    },
    {
      href: routes.analysis.scoutCoverage,
      label: "Scout Coverage",
      icon: <ShieldCheckIcon className="size-4" />,
    },
    { href: routes.analysis.teams, label: "Teams", icon: <ShieldIcon className="size-4" /> },
    {
      href: routes.analysis.comparison,
      label: "Comparison",
      icon: <ArrowLeftRightIcon className="size-4" />,
    },
    eventsLink,
  ];

  return (
    <div
      className="fixed inset-x-0 bottom-0 overflow-hidden"
      style={{ top: isAuthenticated ? "5rem" : "3rem" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] h-full">
        <aside className="h-full border-r hidden md:block overflow-y-auto">
          <NavSidebar title="Scouting Data" links={analysisLinks} />
        </aside>
        <div className="h-full overflow-y-auto min-w-0">
          <div className="sticky top-0 z-40 bg-background border-b px-2 py-1 md:hidden">
            <SidebarSheet title="Scouting Data" links={analysisLinks} />
          </div>
          <div className="p-4 md:p-8 pb-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
