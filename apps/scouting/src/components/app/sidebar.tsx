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
import ProfilePage from "../ProfileYETI";

export function AppSidebar() {
  const pathname = usePathname();
  const { toggleSidebar, state } = useSidebar();

  const menu = [
    { href: "/", label: "Home", icon: <Home className="mr-2" /> },
    { href: "/results", label: "Results", icon: <BarChart2 className="mr-2" /> },
    { href: "/frontend", label: "Scouting", icon: <List className="mr-2" /> },
    { href: "/outreach", label: "Outreach", icon: <Settings className="mr-2" /> },
  ];

  return (
    <>
      {/* Floating open-handle when sidebar is collapsed/offcanvas. */}
      {state === "collapsed" && (
        <button
          aria-label="Open sidebar"
          onClick={() => toggleSidebar()}
          className="fixed left-3 top-4 z-40 hidden h-9 w-9 items-center justify-center rounded-md bg-background/80 shadow-md ring-1 ring-border backdrop-blur-sm transition-all hover:scale-105 sm:flex"
        >
          <ChevronRight size={16} />
        </button>
      )}

      <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
        {state === "expanded" && <SidebarRail />}
      <SidebarContent>
        <SidebarHeader>
          <div className="flex items-center gap-2 w-full justify-between">
           <div className="flex items-center gap-3">
  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="opacity-90"
    >
      <circle cx="12" cy="12" r="8" />
    </svg>
  </div>

  <span className="text-m font-semibold tracking-tight text-foreground">
    Polar Edge
  </span>
</div>
            <button
              aria-label={state === "expanded" ? "Collapse sidebar" : "Expand sidebar"}
              onClick={() => toggleSidebar()}
              className="p-1 rounded hover:bg-muted/10"
            >
              {state === "expanded" ? <ChevronLeft size={19} /> : <ChevronRight size={19} />}
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
          <div className="px-4 py-3 w-full mt-75">
            <div className="flex items-center gap-3">
              <ProfilePage />
              <div>
                <div className="text-[.93rem] text-muted-foreground mb-2">Team 3506</div>
               <Link
                href="/profile"
                className="inline-flex items-center justify-center rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                  View Profile
                    </Link>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xs text-muted-foreground">
                Logged in as <span className="font-medium">User</span>
              </div>
            </div>
          </div>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
    </>
  );
}

export default AppSidebar;
