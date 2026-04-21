import {
  ClipboardIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  StarIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { headers } from "next/headers";
import { type NavLink, NavSidebar } from "@/components/NavSidebar";
import { SidebarSheet } from "@/components/SidebarSheet";
import { auth } from "@/lib/auth";
import { routes } from "@/lib/routes";
import { isScoutLeadOrAbove } from "@/lib/server/auth/require-member";

export default async function FormsLayout({ children }: { children: React.ReactNode }) {
  let isAuthenticated = false;
  let isScoutLead = false;

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    isAuthenticated = !!session?.user;

    const activeMember = await auth.api.getActiveMember({ headers: await headers() });
    if (activeMember) {
      isScoutLead = isScoutLeadOrAbove(activeMember.role);
    }
  } catch {
    // not signed in
  }

  const formsLinks: NavLink[] = [
    {
      href: routes.forms.root,
      label: "Dashboard",
      icon: <LayoutDashboardIcon className="size-4" />,
      exact: true,
    },
    {
      href: routes.forms.stand,
      label: "Stand Form",
      icon: <ClipboardListIcon className="size-4" />,
    },
    {
      href: routes.forms.pit,
      label: "Pit Form",
      icon: <ClipboardIcon className="size-4" />,
    },
    ...(isScoutLead
      ? [
          {
            href: routes.forms.workability,
            label: "Workability",
            icon: <ThumbsUpIcon className="size-4" />,
          },
          {
            href: routes.forms.driveRanking,
            label: "Drive Ranking",
            icon: <StarIcon className="size-4" />,
          },
        ]
      : []),
  ];

  return (
    <div
      className="fixed inset-x-0 bottom-0 overflow-hidden"
      style={{ top: isAuthenticated ? "5rem" : "3rem" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] h-full">
        <aside className="h-full border-r hidden md:block overflow-y-auto">
          <NavSidebar title="Forms" links={formsLinks} />
        </aside>
        <div className="h-full overflow-y-auto min-w-0">
          <div className="sticky top-0 z-40 bg-background border-b px-2 py-1 md:hidden">
            <SidebarSheet title="Forms" links={formsLinks} />
          </div>
          <div className="p-4 md:p-8 pb-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
