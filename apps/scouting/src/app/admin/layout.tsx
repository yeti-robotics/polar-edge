"use client";
import { NavSidebar } from "@/components/NavSidebar";
import { SidebarSheet } from "@/components/SidebarSheet";
import { routes } from "@/lib/routes";
import { CalendarIcon, SettingsIcon, UserPlusIcon, UsersIcon } from "lucide-react";

const adminLinks = [
  { href: routes.admin.members, label: "Members", icon: UsersIcon },
  { href: routes.admin.invites, label: "Invites", icon: UserPlusIcon },
  { href: routes.admin.event, label: "Active Event", icon: CalendarIcon },
  { href: routes.admin.settings, label: "Settings", icon: SettingsIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 top-(--header-height) bottom-0 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] h-full">
        <aside className="h-full border-r hidden md:block overflow-y-auto">
          <NavSidebar title="Admin Hub" links={adminLinks} />
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
