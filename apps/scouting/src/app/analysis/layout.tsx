import { Button } from "@repo/ui/components/button";
import Link from "next/link";

export default function DataLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 top-(--header-height) bottom-0 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] h-full">
        <aside className="h-full border-r hidden md:block overflow-y-auto">
          <div className="flex flex-col p-5">
            <span className="text-xs text-muted-foreground uppercase font-mono">Scouting Data</span>
            <Button variant="ghost" size="sm" asChild>
              <Link className="text-sm w-full justify-start" href="/analysis/comparison">
                Comparison
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link className="text-sm w-full justify-start" href="/analysis/graphs">
                Graph
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link className="text-sm w-full justify-start" href="/analysis/teams">
                Teams
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link className="text-sm w-full justify-start" href="/analysis/events">
                Events
              </Link>
            </Button>
          </div>
        </aside>
        <div className="h-full overflow-y-auto min-w-0">{children}</div>
      </div>
    </div>
  );
}
