"use client";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}

interface NavSidebarProps {
  title: string;
  links: NavLink[];
}

export function NavSidebar({ title, links }: NavSidebarProps) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col h-full bg-sidebar px-3 py-4 gap-1">
      <span className="text-xs uppercase tracking-widest font-mono text-sidebar-foreground/50 px-2 mb-1">
        {title}
      </span>
      {links.map(({ href, label, icon, exact }) => {
        const isActive = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors",
              "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              isActive && "bg-sidebar-accent text-sidebar-foreground font-medium"
            )}
          >
            {icon}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
