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
    <>
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
    </>
  );
}
