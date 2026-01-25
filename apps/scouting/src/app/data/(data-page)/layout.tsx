import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";

export default function DataLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-var(--header-height))]">
      <div className="sticky top-[var(--header-height)] z-40 bg-background md:hidden">
        <Link href="/data">
          <div className="border-b w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
            <ChevronLeftIcon className="size-4" />
            <span>Data</span>
          </div>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] min-h-[calc(100vh-var(--header-height))]">
        <aside className="sticky top-[var(--header-height)] h-[calc(100vh-var(--header-height))] border-r hidden md:block overflow-y-auto">
          <div className="flex flex-col gap-2 p-5">
            <span className="text-xs text-muted-foreground uppercase font-mono">Scouting Data</span>
            <Link className="text-sm" href="/data">
              Data
            </Link>
            <Link className="text-sm" href="/data/graphs">
              Graph
            </Link>
          </div>
        </aside>
        <main className="p-4 md:p-8 overflow-y-auto h-[calc(100vh-var(--header-height))]">
          {children}
        </main>
      </div>
    </div>
  );
}
