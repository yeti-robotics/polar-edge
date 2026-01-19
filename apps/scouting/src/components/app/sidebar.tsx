"use client";

import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  SidebarRail,
  useSidebar,
} from "@repo/ui/components/sidebar";
import { Home, List, BarChart2, Settings } from "lucide-react";
import { Card } from "@repo/ui/components/card";
import { usePathname } from "next/navigation";
import { Avatar } from "@repo/ui/components/avatar";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function AppSidebar() {
  const pathname = usePathname();
  const { toggleSidebar, state } = useSidebar();

  const menu = [
    { href: "/", label: "Home", icon: <Home className="mr-2" /> },
    { href: "/results", label: "Results", icon: <BarChart2 className="mr-2" /> },
    { href: "/frontend", label: "Scouting", icon: <List className="mr-2" /> },
    { href: "/settings", label: "Settings", icon: <Settings className="mr-2" /> },
  ];

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      {state === "expanded" && <SidebarRail />}
      <SidebarContent>
        <SidebarHeader>
          <div className="flex items-center gap-2 w-full justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-muted-foreground/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary"><circle cx="12" cy="12" r="8" /></svg>
              </div>
              <div className="font-semibold">Polar Edge</div>
            </div>
            <button
              aria-label={state === "expanded" ? "Collapse sidebar" : "Expand sidebar"}
              onClick={() => toggleSidebar()}
              className="p-1 rounded hover:bg-muted/10"
            >
              {state === "expanded" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </SidebarHeader>

        <SidebarMenu>
          {menu.map((m) => {
            const isActive = pathname === m.href || pathname?.startsWith(m.href + "/");
            return (
              <SidebarMenuItem key={m.href}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link href={m.href} className={isActive ? "font-semibold text-primary" : ""}>
                    {m.icon}
                    <span>{m.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        <SidebarSeparator />

        <SidebarFooter>
          <div className="px-4 py-3 w-full">
            <div className="flex items-center gap-3">
              <Avatar />
              <div>
                <div className="text-sm font-medium">User</div>
                <div className="text-xs text-muted-foreground">Organization</div>
              </div>
            </div>
          </div>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;
