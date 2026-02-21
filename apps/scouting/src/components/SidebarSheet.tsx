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

interface NavLink {
  href: string;
  label: string;
}

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
          <SheetTitle className="text-xs text-muted-foreground uppercase font-mono font-normal">
            {title}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col px-3">
          {links.map(({ href, label }) => (
            <SheetClose asChild key={href}>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "w-full justify-start",
                  (pathname === href || pathname.startsWith(`${href}/`)) &&
                    "bg-muted text-foreground font-medium"
                )}
              >
                <Link href={href}>{label}</Link>
              </Button>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
