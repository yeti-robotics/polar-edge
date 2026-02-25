"use client";
import { ArrowLeftRightIcon, LayoutDashboardIcon, ShieldIcon, TableIcon } from "lucide-react";
import { NavSidebar } from "@/components/NavSidebar";
import { SidebarSheet } from "@/components/SidebarSheet";
import { routes } from "@/lib/routes";

const analysisLinks = [
  { href: routes.analysis.root, label: "Overview", icon: LayoutDashboardIcon, exact: true },
  { href: routes.analysis.teams, label: "Teams", icon: ShieldIcon },
  { href: routes.analysis.comparison, label: "Comparison", icon: ArrowLeftRightIcon },
  { href: routes.analysis.events, label: "Events", icon: TableIcon },
];

export default function DataLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 top-(--header-height) bottom-0 overflow-hidden">
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
