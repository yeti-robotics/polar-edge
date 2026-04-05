"use client";
import { cn } from "@repo/ui/lib/utils";
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
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "whitespace-nowrap text-muted-foreground hover:text-foreground",
            pathname === item.href && "text-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}
