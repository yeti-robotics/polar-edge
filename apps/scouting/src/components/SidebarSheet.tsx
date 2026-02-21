"use client";
import { Button } from "@repo/ui/components/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/sheet";
import { cn } from "@repo/ui/lib/utils";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLink } from "./NavSidebar";

interface SidebarSheetProps {
  title: string;
  links: NavLink[];
}

export function SidebarSheet({ title, links }: SidebarSheetProps) {
  const pathname = usePathname();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <MenuIcon className="size-4" />
          Menu
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <SheetHeader className="px-5 pt-5 pb-2">
          <SheetTitle className="text-xs uppercase tracking-widest font-mono font-normal text-sidebar-foreground/50">
            {title}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col px-3 gap-1">
          {links.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <SheetClose asChild key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors",
                    "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                    isActive && "bg-sidebar-accent text-sidebar-foreground font-medium"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              </SheetClose>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
