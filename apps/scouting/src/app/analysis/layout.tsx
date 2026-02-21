import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { SidebarSheet } from "@/components/SidebarSheet";

const analysisLinks = [{ href: "/analysis/teams", label: "Teams" }];

export default function DataLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 top-(--header-height) bottom-0 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] h-full">
        <aside className="h-full border-r hidden md:block overflow-y-auto">
          <div className="flex flex-col px-2 py-4">
            <span className="text-xs text-muted-foreground uppercase font-mono mb-1 px-2">
              Scouting Data
            </span>
            <Button variant="ghost" size="sm" asChild>
              <Link className="text-sm w-full justify-start" href="/analysis/teams">
                Teams
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link className="text-sm w-full justify-start" href="/analysis/comparison">
                Comparison
              </Link>
            </Button>
          </div>
        </aside>
        <div className="h-full overflow-y-auto min-w-0">
          <div className="sticky top-0 z-40 bg-background border-b px-2 py-1 md:hidden">
            <SidebarSheet title="Scouting Data" links={analysisLinks} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
