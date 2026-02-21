import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { SidebarSheet } from "@/components/SidebarSheet";
import { routes } from "@/lib/routes";

const adminLinks = [
  { href: routes.admin.members, label: "Members" },
  { href: routes.admin.invites, label: "Invites" },
  { href: routes.admin.event, label: "Active Event" },
  { href: routes.admin.settings, label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 top-(--header-height) bottom-0 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] h-full">
        <aside className="h-full border-r hidden md:block overflow-y-auto">
          <div className="flex flex-col px-2 py-4">
            <span className="text-xs text-muted-foreground uppercase font-mono mb-1 px-2">
              Admin Hub
            </span>
            <Button variant="ghost" size="sm" asChild>
              <Link className="w-full justify-start" href={routes.admin.members}>
                Members
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link className="w-full justify-start" href={routes.admin.invites}>
                Invites
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link className="w-full justify-start" href={routes.admin.event}>
                Active Event
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link className="w-full justify-start" href={routes.admin.settings}>
                Settings
              </Link>
            </Button>
          </div>
        </aside>
        <div className="h-full overflow-y-auto min-w-0">
          <div className="sticky top-0 z-40 bg-background border-b px-2 py-1 md:hidden">
            <SidebarSheet title="Admin Hub" links={adminLinks} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
