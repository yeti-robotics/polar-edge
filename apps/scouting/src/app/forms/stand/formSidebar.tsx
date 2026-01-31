"use client";
import Link from "next/link";
export function FormSidebar() {
  return (
    <aside className="sticky top-0 border-r z-40">
      <div className="flex flex-col gap-2 p-4">
        <span className="text-xs text-muted-foreground uppercase font-mono">Form Hub</span>
        <Link className="text-sm" href="/forms/pit">
          Pit Form
        </Link>
        <Link className="text-sm" href="/forms/stand">
          Stand Form
        </Link>
      </div>
    </aside>
  );
}

//base stand form template pulled from the code I made back in pitform
