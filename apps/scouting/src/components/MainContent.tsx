"use client";

import { useSidebar } from "@repo/ui/components/sidebar";
import React from "react";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();

  // Use the sidebar CSS variables so the main content lines up with the actual
  // sidebar width. When collapsed we use the icon width variable so content
  // doesn't jump to 0 (that caused the odd closing layout behavior).
  const style: React.CSSProperties =
    state === "expanded"
      ? { marginLeft: "var(--sidebar-width)", transition: "margin-left 200ms ease" }
      : { marginLeft: "var(--sidebar-width-icon)", transition: "margin-left 200ms ease" };

  return (
    <main style={style} className="min-h-screen">
      {children}
    </main>
  );
}
