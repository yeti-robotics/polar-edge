import { Button } from "@repo/ui/components/button";
import Link from "next/link";

export default function DataLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-var(--header-height))]">
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] min-h-[calc(100vh-var(--header-height))]">
        <aside className="sticky top-(--header-height) h-[calc(100vh-var(--header-height))] border-r hidden md:block overflow-y-auto">
          <div className="flex flex-col p-5">
            <span className="text-xs text-muted-foreground uppercase font-mono">Scouting Data</span>
            <Button variant="ghost" size="sm" asChild>
              <Link className="text-sm w-full justify-start" href="/data">
                Data
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link className="text-sm w-full justify-start" href="/data/graphs">
                Graph
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link className="text-sm w-full justify-start" href="/data/teams">
                Teams
              </Link>
            </Button>
          </div>
        </aside>
        <main className="p-4 md:p-8 overflow-y-auto h-[calc(100vh-var(--header-height))]">
          {children}
        </main>
      </div>
    </div>
  );
}
