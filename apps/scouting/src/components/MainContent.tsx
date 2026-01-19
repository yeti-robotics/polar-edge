"use client";

import React from "react";
import { useSidebar } from "@repo/ui/components/sidebar";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();

  // When expanded, push content by CSS variable --sidebar-width defined by the sidebar provider/component.
  const style: React.CSSProperties = state === "expanded"
    ? { marginLeft: "var(--sidebar-width)", transition: "margin-left 200ms ease" }
    : { marginLeft: 0, transition: "margin-left 200ms ease" };

  return (
    <main style={style} className="min-h-screen">
      {children}
    </main>
  );
}
