"use client";

import React from "react";

export default function MainContent({ children }: { children: React.ReactNode }) {

  // Use the sidebar CSS variables so the main content lines up with the actual
  // sidebar width. When collapsed we use the icon width variable so content
  // doesn't jump to 0 (that caused the odd closing layout behavior).
  
  return (
    <main className="min-h-screen bg-black dark:bg-black text-white">

      {children}
    </main>
  );
}
