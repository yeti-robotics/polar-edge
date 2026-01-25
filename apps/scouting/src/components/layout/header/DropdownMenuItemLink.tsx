"use client";

import { DropdownMenuItem } from "@repo/ui/components/dropdown-menu";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface DropdownMenuItemLinkProps {
  href: string;
  children: ReactNode;
}

export function DropdownMenuItemLink({ href, children }: DropdownMenuItemLinkProps) {
  const router = useRouter();

  return (
    <DropdownMenuItem onClick={() => router.push(href)}>
      {children}
    </DropdownMenuItem>
  );
}
