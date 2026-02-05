"use client";

import { DropdownMenuItem } from "@repo/ui/components/dropdown-menu";
import Link from "next/link";
import type { ReactNode } from "react";

interface DropdownMenuItemLinkProps {
  href: string;
  children: ReactNode;
}

export function DropdownMenuItemLink({ href, children }: DropdownMenuItemLinkProps) {
  return (
    <DropdownMenuItem asChild>
      <Link href={href}>{children}</Link>
    </DropdownMenuItem>
  );
}
