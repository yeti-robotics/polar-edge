"use client";
import Link from "next/link";
export function FormSidebar() {
  return (
    <aside className="sticky top-0 border-r z-40">
      <div className="flex flex-col gap-2 p-4">
        <span className="text-xs text-muted-foreground uppercase font-mono">Form Hub</span>
        <Link className="text-sm" href="/forms/PreForm">
          {/* this is just there in the case a user wants it this way but we will also make it like a model pop up component  */}
          Match Details
          {/* This is only connected to the stand form*/}
        </Link>
        <Link className="text-sm" href="/forms/Auto">
          Auto Form
        </Link>
        <Link className="text-sm" href="/forms/Teleop">
          Teleop Form
        </Link>
        <Link className="text-sm" href="/forms/PostForm">
          Misc
        </Link>
      </div>
    </aside>
  );
}
