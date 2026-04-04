"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
};
export function HeaderNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap md:flex-nowrap gap-4 md:gap-6 text-sm">
      {items.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "font-bold font-mono text-foreground whitespace-nowrap"
                : "text-muted-foreground hover:text-foreground whitespace-nowrap"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
